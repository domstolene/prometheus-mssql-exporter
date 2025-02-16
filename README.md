Prometheus MSSQL Exporter Docker Container
=============

Prometheus exporter for Microsoft SQL Server (MSSQL). Exposes the following metrics

*  mssql_instance_local_time Number of seconds since epoch on local instance
*  mssql_connections{database,state} Number of active connections
*  mssql_deadlocks Number of lock requests per second that resulted in a deadlock since last restart
*  mssql_user_errors Number of user errors/sec since last restart
*  mssql_kill_connection_errors Number of kill connection errors/sec since last restart
*  mssql_database_state{database} State of each database (0=online 1=restoring 2=recovering 3=recovery pending 4=suspect 5=emergency 6=offline 7=copying 10=offline secondary)
*  mssql_log_growths{database} Total number of times the transaction log for the database has been expanded last restart
*  mssql_database_filesize{database,logicalname,type,filename} Physical sizes of files used by database in KB, their names and types (0=rows, 1=log, 2=filestream,3=n/a 4=fulltext(prior to version 2008 of MS SQL Server))
*  mssql_page_life_expectancy Indicates the minimum number of seconds a page will stay in the buffer pool on this node without references. The traditional advice from Microsoft used to be that the PLE should remain above 300 seconds
*  mssql_io_stall{database,type} Wait time (ms) of stall since last restart
*  mssql_io_stall_total{database} Wait time (ms) of stall since last restart
*  mssql_batch_requests Number of Transact-SQL command batches received per second. This statistic is affected by all constraints (such as I/O, number of users, cachesize, complexity of requests, and so on). High batch requests mean good throughput
*  mssql_page_fault_count Number of page faults since last restart
*  mssql_memory_utilization_percentage Percentage of memory utilization
*  mssql_total_physical_memory_kb Total physical memory in KB
*  mssql_available_physical_memory_kb Available physical memory in KB
*  mssql_total_page_file_kb Total page file in KB
*  mssql_available_page_file_kb Available page file in KB
*  mssql_cpu_usage_percentage Percentage of CPU usage
*  mssql_cpu_idle_percentage Percentage of idle CPU

Please feel free to submit other interesting metrics to include.

# Usage

## Launch an MSSQL server

> Unless you have a local server within reach.

See [Microsoft mssql-server](https://hub.docker.com/_/microsoft-mssql-server) for more information.

```
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=qkD4x3yy" \
  -p 1433:1433 --name sql1 --hostname sql1 -d --network host \
  mcr.microsoft.com/mssql/server:2022-latest
```

To use a persistent storage include `-v /mypath:/var/opt/mssql/data`

## Build and run locally

Build locally:

```
docker build --tag prometheus-mssql-exporter .
```

Run locally:

```
docker run --rm -e SERVER=localhost -e USERNAME=SA -e PASSWORD=qkD4x3yy \
  --network host -e DEBUG=app -p 4000:4000 --name prometheus-mssql-exporter \
  prometheus-mssql-exporter:latest
```

Test locally:

```
curl http://localhost:4000/metrics
```

The image supports the following environments and exposes port 4000

* **SERVER** server ip or dns name (required)
* **PORT** server port (optional defaults to 1433)
* **USERNAME** access user (required)
* **PASSWORD** access password (required)
* **DEBUG** comma delimited list of enabled logs (optional currently supports app and metrics)

It is **_required_** that the specified user has the following permissions

* GRANT VIEW ANY DEFINITION TO <user>
* GRANT VIEW SERVER STATE TO <user>

## Development

### Launch via command line

Run on the local MSSQL-server started above:

```
SERVER=localhost PORT=1433 USERNAME=sa PASSWORD=qkD4x3yy EXPOSE=4000 node ./index.js
```

To enable debugging set the environment variable DEBUG to app and/or metrics. 
For example `DEBUG=app,metrics`
