const debug = require("debug")("app");
const {Connection, Request} = require('tedious');
const express = require('express');

const client = require('./metrics').client;
const up = require('./metrics').up;
const metrics = require('./metrics').metrics;

const userName = process.env["USERNAME"];
const password = process.env["PASSWORD"];
const serverName = process.env["SERVER"];
const portNumber = parseInt(process.env["PORT"], 10) || 1433;
const app = express();

function parseBoolean(value, defaultValue) {
    if (value === undefined || value === "") {
        return defaultValue;
    }

    return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

const config = {
    connect: {
        authentication: {
            type: 'default',
            options: {
                userName: userName,
                password: password,
            }
        },
        server: serverName,
        options: {
            port: portNumber,
            encrypt: true,
            trustServerCertificate: parseBoolean(process.env["TRUST_SERVER_CERTIFICATE"], false),
            rowCollectionOnRequestCompletion: true
        }
    },
    port: parseInt(process.env["EXPOSE"], 10) || 4000
};

if (!serverName) {
    throw new Error("Missing SERVER information")
}
if (!userName) {
    throw new Error("Missing USERNAME information")
}
if (!password) {
    throw new Error("Missing PASSWORD information")
}

/**
 * Connects to a database server.
 *
 * @returns Promise<Connection>
 */
async function connect() {
    return new Promise((resolve, reject) => {
        debug("Connecting to database", serverName);
        const connection = new Connection(config.connect);

        connection.once('connect', (error) => {
            if (error) {
                console.error("Failed to connect to database:", error.message || error);
                reject(error);
                return;
            }

            debug("Connected to database");
            resolve(connection);
        });
        connection.on('end', () => {
            debug("Connection to database ended");
        });
        connection.on('error', (error) => {
            debug("Database connection error", error);
        });
        connection.connect();
    });

}

/**
 * Recursive function that executes all collectors sequentially
 *
 * @param connection database connection
 * @param collector single metric: {query: string, collect: function(rows, metric)}
 *
 * @returns Promise of collect operation (no value returned)
 */
async function measure(connection, collector) {
    return new Promise((resolve) => {
        const request = new Request(collector.query, (error, rowCount, rows) => {
            if (!error) {
                collector.collect(rows, collector.metrics);
                resolve();
            } else {
                console.error("Error executing SQL query", collector.query, error);
                resolve();
            }
        });
        connection.execSql(request);
    });
}

/**
 * Function that collects from an active server.
 *
 * @param connection database connection
 *
 * @returns Promise of execution (no value returned)
 */
async function collect(connection) {
    up.set(1);
    for (let i = 0; i < metrics.length; i++) {
        await measure(connection, metrics[i]);
    }
}

app.get('/healthcheck', (req, res) => {
    res.send("OK");
});

app.get('/metrics', async (req, res) => {
    res.contentType(client.register.contentType);

    try {
        const connection = await connect();
        await collect(connection);
        connection.close();
        res.send(await client.register.metrics());
    } catch (error) {
        // error connecting
        up.set(0);
        res.header("X-Error", error.message || error);
        res.send(await client.register.getSingleMetricAsString(up.name));
    }
});

const server = app.listen(config.port, function () {
    debug(`Prometheus-MSSQL Exporter listening on local port ${config.port} monitoring ${userName}@${serverName}:${portNumber}`);
});

process.on('SIGINT', function () {
    server.close();
    process.exit(0);
});
