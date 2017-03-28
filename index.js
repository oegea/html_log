(function(){
	'use strict';

	/**
	 * Clase para generar logs en ficheros
	 */
	class Log{
		/**
		 * Inicializa la clase
		 * @param  {String} title       Título descriptivo del módulo que genera los logs
		 * @param  {String} description Descripción de las tareas que han sido registradas en este log
		 * @param  {String} logsPath    Path dónde se han de almacenar los logs
		 */
		constructor(title, description, logsPath){
			//Definimos propiedades de la clase
			this.title = title;
			this.description = description;
			this.logsPath = logsPath;
			this.start = new Date();
			this.end = null;
			this.sections = {};

			//Cargamos librerías
			this.fs = require("fs");
		}

		/**
		 * Crea una sección en los logs
		 * @param  {String} name Nombre de la sección que se crea
		 * @param  {String} key  Key identificativa de la sección
		 */
		createSection(name, key){
			this.sections[key] = {
				key: key,
				name: name,
				start: new Date(),
				end: new Date(),
				elapsed: '',
				logs: []
			};
			this.save();
		}

		/**
		 * Termina una sección
		 * @param  {String} key Key de la sección a terminar
		 */
		closeSection(key){
			var section = this.sections[key];
			section.end = new Date();
			section.elapsed = section.end.getTime()-section.start.getTime();
			this.save();
		}

		/**
		 * Genera una entrada de tipo INFO
		 * @param  {String} sectionKey Sección a la que vamos a añadir el log
		 * @param  {String} value      Descripción del log
		 */
		info(sectionKey, value){
			this._pushLog('INFO', sectionKey, value);
		}

		/**
		 * Genera una entrada de tipo ERROR
		 * @param  {String} sectionKey Sección a la que vamos a añadir el log
		 * @param  {String} value      Descripción del log
		 */
		error(sectionKey, value){
			this._pushLog('ERROR', sectionKey, value);
		}

		/**
		 * Genera una entrada de tipo DEBUG
		 * @param  {String} sectionKey Sección a la que vamos a añadir el log
		 * @param  {String} value      Descripción del log
		 */
		debug(sectionKey, value){
			this._pushLog('DEBUG', sectionKey, value);
		}

		/**
		 * Registra una nueva entrada
		 * @param  {String} type       Tipo de entrada a registrar
		 * @param  {String} sectionKey Key de la sección a la que va a pertenecer
		 * @param  {String} value      Descripción del log
		 * @private
		 */
		_pushLog(type, sectionKey, value){
			var log = this._getLogObject(type, value);
			this.sections[sectionKey].logs.push(log);
			this.save();
		}

		/**
		 * Genera un objecto para una entrada del log
		 * @param  {String} type  Tipo de log a generar
		 * @param  {String} value Contenido del log
		 * @return {Object}       Objeto formateado con los datos del log
		 */
		_getLogObject(type, value){

			var dateString = this._dateToString(new Date(), 'dd/mm/yyyy H:i:s');
			var logObject = {type: type, value: value, dateTime: dateString};
			return logObject;
		}

		/**
		 * Guarda el log
		 */
		save(){
			var fullFilePath = this._prepareSave();
			var fileContent = this._render();

			this.fs.writeFileSync(fullFilePath, fileContent); 
		}

		/**
		 * Crea un nuevo mensaje de error en las excepciones
		 * @param  {String} exceptionMessage Mensaje de error
		 */
		errorException(exceptionMessage){
			this._logException('ERROR', exceptionMessage);
		}

		/**
		 * Crea un nuevo mensaje de debug en las excepciones
		 * @param  {String} exceptionMessage Mensaje de debug
		 */
		debugException(exceptionMessage){
			this._logException('DEBUG', exceptionMessage);
		}

		/**
		 * Crea una nueva excepción del tipo especificado
		 * @param  {String} type    Tipo de mensaje
		 * @param  {String} message Mensaje de la excepción
		 */
		_logException(type, message){
			if (this.sections["EXCEPTIONS"] === undefined)
				this.createSection("Unhandled exceptions", "EXCEPTIONS");

			this._pushLog(type, "EXCEPTIONS", message);

			this.closeSection("EXCEPTIONS");
		}

		/**
		 * Calcula la ruta del fichero de log, y crea los directorios en caso de que no existan
		 * @return {String} Ruta completa del fichero de log
		 */
		_prepareSave(){
			//Registramos la fecha de finalización
			this.end = new Date();

			var day = this._dateToString(this.start,'dd');
			var month = this._dateToString(this.start,'mm');
			var year = this._dateToString(this.start,'yyyy');

			var fileName = this.title+"_"+this._dateToString(this.start,'yyyymmdd_His');

			//Si el directorio del día de hoy no existe, lo creamos
			var base = this.logsPath;
			if (!this.fs.existsSync(base+"/"+year)){
    			this.fs.mkdirSync(base+"/"+year);
			}
			if (!this.fs.existsSync(base+"/"+year+"/"+month)){
    			this.fs.mkdirSync(base+"/"+year+"/"+month);
			}
			if (!this.fs.existsSync(base+"/"+year+"/"+month+"/"+day)){
    			this.fs.mkdirSync(base+"/"+year+"/"+month+"/"+day);
			}

			var fullFilePath = base+"/"+year+"/"+month+"/"+day+"/"+fileName+".html";
			return fullFilePath;
		}

		/**
		 * Genera el html que contendrá el fichero de log
		 * @return {String} HTML renderizado del fichero de log
		 */
		_render(){
			var renderedLog = `
			<html>
				<head>
					<title>
						${this.title} - ${this._dateToString(this.start,'dd/mm/yyyy H:i:s')}
					</title>
					<style>
						.INFO{
							color: green;
						}

						.ERROR{
							color: red;
						}

						.DEBUG{
							color: #0790b9;
						}

						.WARNING{
							color: yellow;
						}
					</style>
					<meta charset="utf-8" />
					<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js"></script>
					<script>
						function changeConfig(){
							if ($('#infocheck').is(':checked')) {
								$('.INFO').show();
							}else{
								$('.INFO').hide();
							}

							if ($('#debugcheck').is(':checked')) {
								$('.DEBUG').show();
							}else{
								$('.DEBUG').hide();
							}

							if ($('#warningcheck').is(':checked')) {
								$('.WARNING').show();
							}else{
								$('.WARNING').hide();
							}

							if ($('#errorcheck').is(':checked')) {
								$('.ERROR').show();
							}else{
								$('.ERROR').hide();
							}

							if (window.autoRefreshInterval !== undefined){
								clearInterval(window.autoRefreshInterval);
							}

							if ($('#refreshconfig').val() > 0){
								window.autoRefreshInterval = setInterval(function(){location.reload();}, $('#refreshconfig').val()*1000);
							}
							localStorage.refreshConfig = $('#refreshconfig').val();

							$(".section").show();
							if ($('#hidecategoriescheck').is(':checked')) 
								$(".section:not(:has(div.islog:visible))").hide();
							
						}

						$( document ).ready(function() {
							if (localStorage.refreshConfig !== undefined && localStorage.refreshConfig !== '0'){
								$('#refreshconfig option[value="'+localStorage.refreshConfig+'"]').attr("selected","selected");
							}

							changeConfig();
						});

					</script>
				</head>
				<body>
					<h1>${this.title} log</h1>
					<p>${this.description}</p>
					<h2 id="summary">Summary</h2>
					<p>Started at: ${this._dateToString(this.start,'dd/mm/yyyy H:i:s')}</p>
					<p>Finished at: ${this._dateToString(this.end,'dd/mm/yyyy H:i:s')}</p>
					<div style="position: fixed; right: 50px; background-color:#e2e2e2;">
						<div>
							<select id="refreshconfig" onchange="changeConfig()">
								<option value="0">No auto-refresh</option>
								<option value="5">Refresh every 5 seconds</option>
								<option value="10">Refresh every 10 seconds</option>
								<option value="20">Refresh every 20 seconds</option>
								<option value="30">Refresh every 30 seconds</option>
							</select>
						</div>
						<div>
							<input type="checkbox" id="hidecategoriescheck" onchange="changeConfig()" /> Do not show empty categories
						</div>
						<div>
							<input type="checkbox" id="infocheck" checked onchange="changeConfig()" />Show INFO logs
						</div>
						<div>
							<input type="checkbox" id="debugcheck" checked onchange="changeConfig()" />Show DEBUG logs
						</div>
						<div>
							<input type="checkbox" id="warningcheck" checked onchange="changeConfig()" />Show WARNING logs
						</div>
						<div>
							<input type="checkbox" id="errorcheck" checked onchange="changeConfig()" />Show ERROR logs
						</div>
					</div>
					<h2>Sections of this report</h2>
					<ul>
						${function(){
							var sectionsStr = ``;
							for (var i in this.sections){
								var section = this.sections[i];
								sectionsStr += `
									<li><a href="#${section.key}">${section.name}</a></li>
								`;
							}
							return sectionsStr;
						}.bind(this)()}
					</ul>
					${function(){
						var sectionsStr = ``;
						for (var i in this.sections){
							var section = this.sections[i];
							sectionsStr += `
								<div class="section">
									<h2 id="${section.key}" style="display: inline-block;">${section.name}</h2>
									<p style="display: inline-block; padding-left: 20px;">(<a href="#summary">Return to summary</a>)</p>
									<p>Started at: ${this._dateToString(section.start, 'dd/mm/yyyy H:i:s')}</p>
									<p>Finished at: ${this._dateToString(section.end, 'dd/mm/yyyy H:i:s')}</p>
									${function(){
										var logsStr = ``;
										for (var j in section.logs){
											var log = section.logs[j];
											logsStr += `
											<div class="${log.type} islog">${log.type} (${log.dateTime}): ${log.value}</div>
											`;
										}
										return logsStr;
									}.bind(this)()}
								</div>
							`;
						}
						return sectionsStr;
					}.bind(this)()}
				</body>
			</html>
			`;

			return renderedLog;
		}

		/**
		 * Convierte un objeto Date a String
		 * @param  {Date} 	dateTime Objeto fecha a convertir
		 * @param  {String} template Formato que tendrá el string a retornar
		 * @return {String}          Fecha en string convertida
		 */
		_dateToString(dateTime, template){
			var day = dateTime.getDate();
			day = (day < 10)?"0"+day:day;

			var month = dateTime.getMonth()+1;
			month = (month < 10)?"0"+month:month;

			var year = dateTime.getFullYear();

			var hours = dateTime.getHours();
			var minutes = dateTime.getMinutes();
			var seconds = dateTime.getSeconds();


			template = template.replace('dd', day);
			template = template.replace('mm', month);
			template = template.replace('yyyy', year);
			template = template.replace('H', hours);
			template = template.replace('i', minutes);
			template = template.replace('s', seconds);

			return template;
		}


	}

	module.exports = Log;
}())