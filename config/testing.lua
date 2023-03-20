return {
    redis = {
        host = "redis",
        port = 6379,
    },
    postgres = {
        host = "postgres",
        port = 5432,
        user = "postgres",
        database = "postgres",
        password = "postgres",
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
