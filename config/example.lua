return {
    redis = {
        host = "127.0.0.1",
        port = 6379,
    },
    postgres = {
        -- pgmoon options
        use_super = true,
        use_migrations = true,
    },
    email = {
        host = "localhost",
        port = 25,
        from = "foxcaves@localhost",
        -- username = "user",
        -- password = "pass",
        -- ssl = true,
    },
    http = {
        short_url = "http://short.foxcaves",
        main_url = "http://main.foxcaves",
        enable_acme = true,
        redirect_www = true,
        upstream_ips = {"1.2.3.4"},
    },
    sentry = {
        dsn = nil,
    },
}
