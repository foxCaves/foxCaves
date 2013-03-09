<%+ head %>
<h1>foxScreen information (<a href="<%= STATIC_URL_PREFIX %>/dls/foxScreen.exe?v=<%= G.ngx.time() %>">Download here</a>)</h1>
<h3>
	When you first start foxScreen, you will be presented with the main window of foxScreen:<br />
</h3>
<img src="<%= STATIC_URL_PREFIX %>/img/foxscreen/main_window.png" />
<h4>
	Just enter your login details and click "Save credentials".
</h4>
<h3>
	You may notice a little tray icon of foxScreen:
</h3>
<img src="<%= STATIC_URL_PREFIX %>/img/foxscreen/notify_bar.png" />
<h4>
	If you double-click it, that will hide/show the main window<br />
	If you click it once, it will hide/show the drop area (explained later)
</h4>
<h3>
	The drop area of foxScreen looks like the following
</h3>
<img src="<%= STATIC_URL_PREFIX %>/img/foxscreen/drop_area.png" />
<h4>
	Any file you drop onto it (out of a explorer window, etc) will be uploaded to your foxCaves account.<br />
	The uploaded file's link will be automatically copied into your clipboard
</h4>
<h3>
	foxScreen also has a few key combinations for making screenshots faster
</h3>
<h4>
	PrintScreen uploads a screenshot of your entire screen to foxCaves<br />
	Alt+PrintScreen makes a screenshot of the currently selected window<br />
	Ctrl+PrintScreen lets you pick an area of your screen to screenshot
	<h5>Just click and drag a rectangle. Screenshot will be made once you release your mouse button. Use escape to cancel.</h5>
</h4>
<br /><br /><br />
<h3>
	Licensing information
</h3>
<pre>
foxScreen Copyright (c) Doridian
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of Doridian nor the names of his contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
</pre>
<pre>
foxScreen uses the MouseKeyboardActivityMonitor library
Copyright (c) 2004-2011, Application and Global Mouse and Keyboard Hooks .Net Libary
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of Application and Global Mouse and Keyboard Hooks .Net Libary nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
</pre>
<pre>
foxScreen uses SlimDX
Copyright (c) 2007-2011 SlimDX Group

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
</pre>
<h3>
	Can I get the source code anywhere?
</h3>
<h4>
	Sure, you can get all the source code at <a href="https://github.com/foxCaves">https://github.com/foxCaves</a>
</h4>
<%+ foot %>
