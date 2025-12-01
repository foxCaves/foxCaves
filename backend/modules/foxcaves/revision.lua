local revision = (os.getenv('GIT_REVISION') or 'UNKNOWN'):gsub('%s+', '')
return { hash = revision }
