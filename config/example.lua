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
    cookies = {
        path = "/",
        httponly = true,
        secure = true,
    },
    storage = {
        --driver = "local",
        --root_folder = "/var/www/foxcaves/storage",
        temp_folder = "/tmp",

        driver = "s3",

        access_key = "",
        secret_key = "",
        bucket = "example",
        host = "s3.us-west-001.backblazeb2.com",

        keepalive = {
            pool_size = 100,
            idle_timeout = 60,
        },
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
