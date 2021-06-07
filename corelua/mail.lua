local IS_MAIL_DEVELOPMENT = false

dofile("/opt/foxcaves_config/mail.lua")
local mailip = mailip
local mailuser = mailuser
local mailpass = mailpass
_G.mailip = nil
_G.mailuser = nil
_G.mailpass = nil

local function smtp_recv_line(sock)
	local recv = sock:receive("*l")
	while recv and recv:sub(4,4) == "-" do
		if IS_MAIL_DEVELOPMENT then
			ngx.print("< "..(recv or "").."<br>")
		end
		recv = sock:receive("*l")
	end
	if IS_MAIL_DEVELOPMENT then
		ngx.print("< "..(recv or "").."<br>")
	end
end

local function smtp_send_line(sock, line)
	sock:send(line.."\r\n")
	if IS_MAIL_DEVELOPMENT then
		ngx.print("> "..line.."<br>")
	end
	smtp_recv_line(sock)
end

function mail(to_addr, subject, content, from_addr, from_name, headers)
	local sock = ngx.socket.tcp()

	local ok, err = sock:connect(mailip, 465)
	if not ok then
		error("Failed to connect to SMTP: " .. err)
	end

	local ok, err = sock:sslhandshake()
	if not ok then
		error("Failed to handshake SSL to SMTP: " .. err)
	end

	smtp_recv_line(sock)
	smtp_send_line(sock, "EHLO foxcav.es")

	if not from_name then
		from_name = from_addr
	end

	if mailuser and mailpass then
		smtp_send_line(sock, "AUTH PLAIN "..ngx.encode_base64(string.format("%s\0%s\0%s", mailuser, mailuser, mailpass)))
	end

	if from_addr then
		smtp_send_line(sock, "MAIL FROM: "..from_addr)
	end

	smtp_send_line(sock, "RCPT TO: "..to_addr)

	smtp_send_line(sock, "DATA")

	if from_addr then
		sock:send("From: "..from_name.." <"..from_addr..">\r\n")
	end
	sock:send("To: "..to_addr.."\r\n")
	sock:send("Subject: "..subject.."\r\n")
	if headers then
		sock:send(headers)
	end
	sock:send("\r\n")
	sock:send(content)
	smtp_send_line(sock, "\r\n.")
	smtp_send_line(sock, "QUIT")
	sock:close()
end
