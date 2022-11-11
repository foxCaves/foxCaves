return {
    redis = {
        host = "127.0.0.1",
        port = 6379,
    },
    postgres = {
        host = "127.0.0.1",
        port = 5432,
        user = "foxcaves",
        database = "foxcaves",
        use_super = true,
        use_migrations = true,
    },
    email = {
        host = "localhost",
        port = 25,
        from = "foxcaves@localhost",
    },
    http = {
        short = "http://short.foxcaves",
        main = "http://main.foxcaves",
        enable_acme = false,
        redirect_www = false,
        upstream_ips = {},
    },
    sentry = {
        dsn = nil,
    },
}
