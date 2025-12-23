var htmlHelpButton = '<a style="cursor: pointer; float: right; position: relative; text-align: center;" onclick="exibeHelp()"><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAA2ElEQVQ4y2NgQAPiUfuNxCL3zwTi20D8G4pB7JkgOQZcQDL6ABdQ0Wwg/gvE/3FgkNxskFpsmg/j0YiOD6MYArWZWM0wPBvZz9icPRdoi4xkzAERILsGm3fAYQINMHTJ+zJxB1mAdB4QV0FdeRyLupkM0BBGlzgtHrk/DEj/BBkGNWA7FnW3GaDRhMufn4HOtABiNSD7Oxb534QMqAOGAx8OV8INuI3HgIlA3I5H/jauQIThnVCMS34mvmj8D5SzA2FcqRKetPEkpI9QjDshUSUpU5yZKMnOAN3ywB6yKg58AAAAAElFTkSuQmCC" /><br>Ajuda</a>';
var help = {};
var baseUrl = '/siscob/';


if (window.location.href.indexOf('homologacaosistemas.dnpm.gov.br') != -1 || window.location.href.indexOf('homologacaoapp.dnpm.gov.br') != -1) {
    baseUrl = 'https://homologacaoapp.dnpm.gov.br' + '/siscob/';
    if (typeof jQuery == 'undefined') {
        // jQuery hasn't been loaded... so let's write it into the head immediately.
        document.write('<script type="text/javascript" src="' + 'https://homologacaoapp.dnpm.gov.br' + '/siscob/scripts/lib/jquery-1.4.1.min.js"><\/script>');
    }
    document.write('<script type="text/javascript" src="' + 'https://homologacaoapp.dnpm.gov.br' + '/siscob/scripts/lib/sweetalert.min.js"><\/script>');
    document.write('<link href="' + 'https://homologacaoapp.dnpm.gov.br' + '/siscob/Content/lib/sweetalert.css" rel="stylesheet"  />')
}

else if (window.location.href.indexOf('sistemas.dnpm.gov.br') != -1 || window.location.href.indexOf('app.dnpm.gov.br') != -1) {
    baseUrl = 'https://app.dnpm.gov.br' + '/siscob/';
    if (typeof jQuery == 'undefined') {
        // jQuery hasn't been loaded... so let's write it into the head immediately.
        document.write('<script type="text/javascript" src="' + 'https://app.dnpm.gov.br' + '/siscob/scripts/lib/jquery-1.4.1.min.js"><\/script>');
    }
    document.write('<script type="text/javascript" src="' + 'https://app.dnpm.gov.br' + '/siscob/scripts/lib/sweetalert.min.js"><\/script>');
    document.write('<link href="' + 'https://app.dnpm.gov.br' + '/siscob/Content/lib/sweetalert.css" rel="stylesheet"  />')
}

else {
    if (typeof jQuery == 'undefined') {
        // jQuery hasn't been loaded... so let's write it into the head immediately.
        document.write('<script type="text/javascript" src="/siscob/scripts/lib/jquery-1.4.1.min.js"><\/script>');
    }
    document.write('<script type="text/javascript" src="/siscob/scripts/lib/sweetalert.min.js"><\/script>');
    document.write('<link href="/siscob/Content/lib/sweetalert.css" rel="stylesheet"  />')
}

function exibeHelp() {
    swal({
        title: "Ajuda da página",
        text: help.DSAjuda,
        type: "info",
        showCancelButton: false,
        showconfirmButtonColor: "#DD6B55",
        confirmButtonText: "Fechar",
        closeOnConfirm: true,
        html: true
    });
    $(".showSweetAlert").scrollTop(0);
}

function carregaHelp() {
    var urlAtual = window.location.href;
    var url = baseUrl + "Help/ObterPorUrl";
    var data = { url: urlAtual };
    $.ajax({
        'type': "POST"
          , 'url': url
          , 'contentType': "application/json"
          , 'dataType': "json"
          , 'data': typeof data == "string" ? data : JSON.stringify(data || {})
          //, beforeSend: function (jqXHR) {
          //    jqXHR.setRequestHeader("X-MicrosoftAjax", "Delta=true");
          //}
          , 'complete': function (jqXHR, textStatus) {
              if (textStatus == "success") {
                  help = ((JSON && JSON.parseAjax) || $.parseJSON)(jqXHR.responseText);

                  if (help != null) {
                      $(".cabecalho-form").before(htmlHelpButton);
                  }
              }
          }
    });
}
setTimeout(function () {
    $(document).ready(function () {
        carregaHelp();

    });

}, 2000)
