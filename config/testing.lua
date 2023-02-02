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
    cookies = {
        path = "/",
        httponly = true,
        secure = false,
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
            read_chunk_size = 8192,

            access_key = "",
            secret_key = "",
            bucket = "example",
            host = "s3.us-west-001.backblazeb2.com",

            keepalive = {
                pool_size = 100,
                idle_timeout = 60,
                max_time = 60 * 60,
                max_requests = 1000,
            },
        },
    },
    http = {
        short_url = "http://short.foxcaves",
        main_url = "http://main.foxcaves",
        enable_acme = false,
        redirect_www = false,
        force_plaintext = true,
        upstream_ips = {"127.0.0.1"},
    },
    sentry = {
        dsn = nil,
    },
}
