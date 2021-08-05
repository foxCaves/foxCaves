-- ROUTE:POST:/api/v1/users/self/logout
dofile_global()

ngx.ctx.logout()
