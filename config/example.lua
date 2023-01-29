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
    files = {
        thumbnail_max_size = 50 * 1024 * 1024,
    },
    storage = {
        default = "fs",

        fs = {
            driver = "local",
            chunk_size = 8192,
            root_folder = "/var/www/foxcaves/storage",
        },

        s3 = {
            driver = "s3",
            chunk_size = 5 * 1024 * 1024,

            access_key = "",
            secret_key = "",
            bucket = "example",
            host = "s3.us-west-001.backblazeb2.com",

            keepalive = {
                pool_size = 100,
                idle_timeout = 60,
            },
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
