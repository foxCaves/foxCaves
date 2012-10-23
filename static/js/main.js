var loadingEles = 0;
function loadDone() {
	loadingEles--;
	if(loadingEles == 0) {
		window.prettyPrint && prettyPrint();
	}
}
$(document).ready(function(){
	var eles = document.getElementsByTagName("pre");
	for(i=0; i < eles.length; i++) {
		var ele = eles[i];
		var src = ele.getAttribute('data-thumbnail-source');
		if(!src) continue;
		ele.style.display = "";
		ele.innerHTML = "[Loading preview...]";
		loadingEles++;
		$.get('/thumbs/'+src, function(data) {
			ele.innerHTML = data;
			loadDone();
		});
	}

	if(loadingEles <= 0) {
		loadingEles = 1;
		loadDone();
	}
})
