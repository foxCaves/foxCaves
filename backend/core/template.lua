local preprocessTemplate

local function loadTemplateFile(name, insideother)
	local file = io.open("templates/"..name..".tpl")
	local code = file:read("*all")
	file:close()

	code = preprocessTemplate(code, insideother)

	if not IS_DEVELOPMENT then
		code = ngx.re.gsub(code, "<!--(.*?)-->", "", "o")
		code = ngx.re.gsub(code, "(?>[^\\S ]\\s*| \\s{2,})(?=[^<]*+(?:<(?!/?(?:textarea|script|pre)\\b)[^<]*+)*+(?:<(?>textarea|script|pre)\\b| \\z))", " ", "oix")
		--code = ngx.re.gsub(code, "^[\r\n\t ]+", "", "o")
		--code = ngx.re.gsub(code, "[\r\n\t ]+$", "", "o")
	end

	return code
end

function preprocessTemplate(code, insideother)
	local startPos
	local endPos = 0
	local match
	local marker
	local lastCut = 1
	local concatTbl
	if insideother then
		concatTbl = {}
	else
		concatTbl = {"return function() local retTbl = {}"}
	end

	while true do
		startPos, endPos, marker, match = string.find(code, "<%%([#=+]?)%s*(.-)%s*%%>", endPos+1)
		if(not startPos) then
			break
		end

		local codeBlock = code:sub(lastCut, startPos-1)
		if codeBlock ~= "" then
			table.insert(concatTbl, "tinsert(retTbl, [["..codeBlock.."]])")
		end

		if(match ~= "") then
			if(marker == "=") then
				table.insert(concatTbl, "tinsert(retTbl, "..match..")")
			elseif(marker == "+") then
				table.insert(concatTbl, loadTemplateFile(match, true))
			elseif(marker == "#") then
				table.insert(concatTbl, 'tinsert(retTbl, "' .. loadstring("return " .. match)() .. '")')
			else
				table.insert(concatTbl, match)
			end
		end
		lastCut = endPos+1
	end
	if(lastCut == 1 and not insideother) then return "return [["..code.."]]" end
	local codeBlock = code:sub(lastCut, code:len())
	if codeBlock ~= "" then
		table.insert(concatTbl, "tinsert(retTbl, [["..codeBlock.."]])")
	end
	if not insideother then table.insert(concatTbl, "return tconcat(retTbl) end") end
	return table.concat(concatTbl, "\n")
end

local templateCacheGlobal = {}
local function loadTemplate(name)
        local cdir = ngx.ctx.temp_cdir
        if not cdir then
                cdir = lfs.currentdir()
                ngx.ctx.temp_cdir = cdir
        end
        local templateCache = templateCacheGlobal[cdir]
        if not templateCache then
                templateCache = {}
                templateCacheGlobal[cdir] = templateCache
        end

	if(templateCache[name]) then
		return templateCache[name]
	end

	local code = loadTemplateFile(name, false)
	local func, err = load(code, "TEMPLATE:"..name)
	if(not func) then
		error(
			string.format(
				"Failed to compile template %s : %s",
				name,
				err
			)
		)
	end
	templateCache[name] = func
	return func
end

function load_template(name, params)
	local tpl = loadTemplate(name)()
	if type(tpl) == "string" then
		return tpl
	end

	if not params then params = {} end

	params.pairs = pairs
	params.ipairs = ipairs
	params.next = next
	params.tostring = tostring
	params.tinsert = table.insert
	params.tconcat = table.concat
	params.SHORT_URL = SHORT_URL
	params.MAIN_URL = MAIN_URL
	params.G = _G

	return setfenv(tpl, params)()
end
