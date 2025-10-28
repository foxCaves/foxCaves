return {
    redis = {
        host = "redis",
        port = 6379
    },
    mysql = {
        host = "mysql",
        port = 3306,
        user = "foxcaves",
        database = "foxcaves",
        password = "foxcaves",
    },
    email = {
        host = "localhost",
        port = 25,
        from = "foxcaves@localhost",
        admin_email = "admin@localhost"
    },
    cookies = {
        path = "/",
        httponly = true,
        secure = false,
        samesite = "Strict"
    },
    files = {
        thumbnail_max_size = 50 * 1024 * 1024
    },
    app = {
        disable_email_confirmation = true,
        require_user_approval = false,
        expiry_check_period = 60 * 15, -- 15 minutes
        executor = "debug",
    },
    totp = {
        max_past = 1,
        max_future = 1,
        secret_bytes = 20,
        issuer = "foxCaves TESTING"
    },
    captcha = {
        registration = false,
        login = false,
        forgot_password = false,
        resend_activation = false
    },
    storage = {
        default = "fs",

        backends = {
            fs = {
                driver = "local",
                chunk_size = 8192,
                root_folder = "/var/www/foxcaves/storage"
            },
        },
    },
    http = {
        cdn_url = "http://cdn.foxcaves:8080",
        app_url = "http://app.foxcaves:8080",
        redirect_www = false,
        force_plaintext = true,
        upstream_ips = { "127.0.0.1" },
        auto_ssl = {
            ca = "letsencrypt-test"
        }
    },
    sentry = {
        dsn = nil,
        dsn_frontend = nil
    }
}
