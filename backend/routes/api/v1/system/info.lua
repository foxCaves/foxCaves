-- ROUTE:GET:/api/v1/system/info

ngx.print(cjson.encode({
    environment = ENVIRONMENT,
    release = REVISION,
}))
