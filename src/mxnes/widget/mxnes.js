require(
	{
		packages:[
			{
				name:'jsnes',
				location:'/widgets/mxnes/lib/jsnes-1.1.0/dist/',
				main:'jsnes.min'
			}

		]
	},
	[
		"dojo/_base/declare",
		"mxui/widget/_WidgetBase",
		"dijit/_TemplatedMixin",
		"mxui/dom",
		"dojo/dom",
		"dojo/dom-prop",
		"dojo/dom-geometry",
		"dojo/dom-class",
		"dojo/dom-style",
		"dojo/dom-construct",
		"dojo/_base/array",
		"dojo/_base/lang",
		"dojo/text",
		"dojo/html",
		"dojo/_base/event",
		'jsnes',
		"dojo/text!mxnes/widget/template/mxnes.html"
	],
	function(
		declare,
		_WidgetBase,
		_TemplatedMixin,
		dom,
		dojoDom,
		dojoProp,
		dojoGeometry,
		dojoClass,
		dojoStyle,
		dojoConstruct,
		dojoArray,
		lang,
		dojoText,
		dojoHtml,
		dojoEvent,
		_jsnes,
		widgetTemplate
	){
		return declare(
			"mxnes.widget.mxnes",
			[
				_WidgetBase,
				_TemplatedMixin
			],
			{
				templateString:widgetTemplate,
				widgetBase:null,
				_handles:null,
				_contextObj:null,
				loaded:false,
				nes:null,
				SCREEN_WIDTH:null,
				SCREEN_HEIGHT:null,
				FRAMEBUFFER_SIZE:null,
				canvas:null,
				canvas_ctx:null,
				image:null,
				framebuffer_u8:null,
				framebuffer_u32:null,
				AUDIO_BUFFERING:null,
				SAMPLE_COUNT:null,
				SAMPLE_MASK:null,
				SAMPLE_COUNT:null,
				audio_samples_L:null,
				audio_samples_R:null,
				audio_write_cursor:null,
				audio_read_cursor:null,
				constructor: function () {
					this._handles = [];
				},
				postCreate: function () {
				},
				update: function (obj, callback) {
					this._contextObj = obj;
					this._updateRendering(callback);
				},
				resize: function (box) {
				},
				uninitialize: function () {
				},
				destroy: function () {
					//destructor???
					this.nes=null;
				},
				_updateRendering: function (callback) {
					if (this._contextObj !== null) {
						if(!this.loaded){
							this.loaded=true;
							var fileurl="/file?guid="+this._contextObj.getGuid()+"&changeDate="+(new Date().getTime());
							//var filename=this._contextObj.get("Name");
							this.init();
							this.nes_init(this.canvas);
							this.nes_load_url(this.canvas,fileurl);
						}else{
						}
						dojoStyle.set(this.domNode, "display", "block");
					} else {
						dojoStyle.set(this.domNode, "display", "none");
					}

					this._executeCallback(callback, "_updateRendering");
				},
				_execMf: function (mf, guid, cb) {
					if (mf && guid) {
						mx.ui.action(mf, {
							params: {
								applyto: "selection",
								guids: [guid]
							},
							callback: lang.hitch(this, function (objs) {
								if (cb && typeof cb === "function") {
									cb(objs);
								}
							}),
							error: function (error) {
								console.debug(error.description);
							}
						}, this);
					}
				},
				_executeCallback: function (cb, from) {
					if (cb && typeof cb === "function") {
						cb();
					}
				},
				init:function(){
					this.SCREEN_WIDTH = 256;
					this.SCREEN_HEIGHT = 240;
					this.FRAMEBUFFER_SIZE = this.SCREEN_WIDTH*this.SCREEN_HEIGHT;
					this.AUDIO_BUFFERING = 512;
					this.SAMPLE_COUNT = 4*1024;
					this.SAMPLE_MASK = this.SAMPLE_COUNT - 1;
					this.audio_samples_L = new Float32Array(this.SAMPLE_COUNT);
					this.audio_samples_R = new Float32Array(this.SAMPLE_COUNT);
					this.audio_write_cursor = 0,
					this.audio_read_cursor = 0;
					this.nes = new _jsnes.NES(
						{
							onFrame: dojo.hitch(
								this,
									function(framebuffer_24){
										for(var i = 0; i < this.FRAMEBUFFER_SIZE; i++) this.framebuffer_u32[i] = 0xFF000000 | framebuffer_24[i];
									}
							),
							onAudioSample: dojo.hitch(
								this,
								function(l, r){
									this.audio_samples_L[this.audio_write_cursor] = l;
									this.audio_samples_R[this.audio_write_cursor] = r;
									this.audio_write_cursor = (this.audio_write_cursor + 1) & this.SAMPLE_MASK;
								}
							)
						}
					);
					document.addEventListener('keydown', (event) => {this.keyboard(this.nes.buttonDown, event)});
					document.addEventListener('keyup', (event) => {this.keyboard(this.nes.buttonUp, event)});
				},
				onAnimationFrame:function(){
					window.requestAnimationFrame(dojo.hitch(this,this.onAnimationFrame));
					
					this.image.data.set(this.framebuffer_u8);
					this.canvas_ctx.putImageData(this.image, 0, 0);
					this.nes.frame();
				},
				audio_remain:function(){
					return (this.audio_write_cursor - this.audio_read_cursor) & this.SAMPLE_MASK;
				},
				audio_callback:function(event){
					/*
					var dst = event.outputBuffer;
					var len = dst.length;
					// Attempt to avoid buffer underruns.
					if(this.audio_remain() < this.AUDIO_BUFFERING) this.nes.frame();
					var dst_l = dst.getChannelData(0);
					var dst_r = dst.getChannelData(1);
					for(var i = 0; i < len; i++){
						var src_idx = (this.audio_read_cursor + i) & this.SAMPLE_MASK;
						dst_l[i] = this.audio_samples_L[src_idx];
						dst_r[i] = this.audio_samples_R[src_idx];
					}
					this.audio_read_cursor = (this.audio_read_cursor + len) & this.SAMPLE_MASK;
					*/
				},
				keyboard:function(callback, event){
					var player = 1;
					switch(event.keyCode){
						case 38: // UP
							callback(player, _jsnes.Controller.BUTTON_UP); break;
						case 40: // Down
							callback(player, _jsnes.Controller.BUTTON_DOWN); break;
						case 37: // Left
							callback(player, _jsnes.Controller.BUTTON_LEFT); break;
						case 39: // Right
							callback(player, _jsnes.Controller.BUTTON_RIGHT); break;
						case 65: // 'a' - qwerty, dvorak
						case 81: // 'q' - azerty
							callback(player, _jsnes.Controller.BUTTON_A); break;
						case 83: // 's' - qwerty, azerty
						case 79: // 'o' - dvorak
							callback(player, _jsnes.Controller.BUTTON_B); break;
						case 9: // Tab
							callback(player, _jsnes.Controller.BUTTON_SELECT); break;
						case 13: // Return
							callback(player, _jsnes.Controller.BUTTON_START); break;
						default: break;
					}
				},
				nes_init:function(canvas){
					this.canvas_ctx = canvas.getContext("2d");
					this.image = this.canvas_ctx.getImageData(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
					
					this.canvas_ctx.fillStyle = "black";
					this.canvas_ctx.fillRect(0, 0, this.SCREEN_WIDTH, this.SCREEN_HEIGHT);
					
					// Allocate framebuffer array.
					var buffer = new ArrayBuffer(this.image.data.length);
					this.framebuffer_u8 = new Uint8ClampedArray(buffer);
					this.framebuffer_u32 = new Uint32Array(buffer);
					
					// Setup audio.
					var audio_ctx = new window.AudioContext();
					var script_processor = audio_ctx.createScriptProcessor(this.AUDIO_BUFFERING, 0, 2);
					script_processor.onaudioprocess = dojo.hitch(this,this.audio_callback);
					script_processor.connect(audio_ctx.destination);
				},
				nes_boot:function(rom_data){
					this.nes.loadROM(rom_data);
					window.requestAnimationFrame(dojo.hitch(this,this.onAnimationFrame));
				},
				nes_load_data:function(canvas, rom_data){
					this.nes_init(canvas);
					this.nes_boot(rom_data);
				},
				nes_load_url:function(canvas, path){
					this.nes_init(canvas);
					var req = new XMLHttpRequest();
					req.open("GET", path);
					req.overrideMimeType("text/plain; charset=x-user-defined");
					req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`);
					req.onload = dojo.hitch(
						this,
						function() {
							/*
							console.log(req.response);//.responseText);
							if (this.status === 200) {
								console.log('a')
							this.nes_boot(this.responseText);
							} else if (this.status === 0) {
								console.log('b')
								// Aborted, so ignore error
							} else {
								console.log('c')
								req.onerror();
							}
							*/
							this.nes_boot(req.response);
						}
					)
					req.send();
				}
			}
		);
	}
);
//require(["mxnes/widget/mxnes"]);
