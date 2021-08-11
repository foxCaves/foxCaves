CONFIG = {
    redis = {
        ip = "127.0.0.1",
        port = 6379,
        password = nil,
    },
    postgres = {
        -- pgmoon options
    },
    email = {
        ip = "email-smtp.us-east-1.amazonaws.com",
        user = "",
        password = "",
    },
    urls = {
        short = "http://short.foxcaves",
        main = "http://main.foxcaves",
    },
    sentry = {
        dsn = nil,
        dsn_frontend = nil,
    },
}
