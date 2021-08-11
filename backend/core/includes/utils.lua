function explode(div,str) -- credit: http://richard.warburton.it
	local pos, arr = 0, {}
	-- for each divider found
	for st, sp in function() return str:find(div,pos,true) end do
		table.insert(arr,str:sub(pos,st-1)) -- Attach chars left of current divider
		pos = sp + 1 -- Jump past current divider
	end
	table.insert(arr, str:sub(pos)) -- Attach chars right of last divider
	return arr
end
