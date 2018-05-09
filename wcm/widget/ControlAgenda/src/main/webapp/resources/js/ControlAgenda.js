var ControlAgenda = SuperWidget.extend({
    //método iniciado quando a widget é carregada
    init: function () {
        //variáveis da widget
        let credenciais = ControlAgenda.getIds();
        ControlAgenda.login = credenciais.login;
        ControlAgenda.password = credenciais.password;
        ControlAgenda.parentId = (/ecp-teste/g).test(window.location.hostname) ? 994 : 123745;

        ControlAgenda.myTable = null;
        ControlAgenda.mydata = [];
        ControlAgenda.myAutocomplete = [];
        ControlAgenda.tableData = null;
        ControlAgenda.arrayRoles = new Object();
        ControlAgenda.urlService = WCMAPI.serverURL + "/webdesk/ECMCardService?wsdl";
        ControlAgenda.categorias = [];
        ControlAgenda.tenantCode = null;
        ControlAgenda.instanceId = null;
        ControlAgenda.tenantCode = WCMAPI.tenantCode;
        ControlAgenda.instanceId = this.instanceId;
        this.loaderTable();
        //FUNÇÃO PARA ADIÇÃO PICKEDATE
        $('body').on('mousedown', 'input[data-calendar].fs-no-bg', function (event) {
            var dateMin, dateMax, dateDefault;
            if ($(this).data('calendar') === 'data') {
                if (this.name === 'dataInicio') {
                    dateMin = moment();
                    dateMax = moment().add(1, 'y');
                } else if (this.name === 'dataFim' && $('input[name=dataInicio]').val() !== '') {
                    dateMin = moment($('input[name=dataInicio]').val(), 'DD/MM/YYYY');
                    dateMax = moment($('input[name=dataInicio]').val(), 'DD/MM/YYYY').add(1, 'M');
                }
                ControlAgenda.calendar = FLUIGC.calendar('[name=' + this.name + ']', {
                    language: 'pt-br',
                    pickDate: true,
                    pickTime: false,
                    useCurrent: false,
                    showToday: true,
                    defaultDate: "",
                    disabledDates: [],
                    useStrict: true,
                    formatDate: 'DD/MM/YYYY',
                    daysOfWeekDisabled: [0, 6]
                });
                if (this.name !== 'dateConsulta_' + ControlAgenda.instanceId) {
                    ControlAgenda.calendar.setMinDate(dateMin);
                    ControlAgenda.calendar.setMaxDate(dateMax);
                }
            } else if ($(this).data('calendar') === 'horas') {
                if (this.name === 'horaInicio') {
                    dateMin = moment({ 'h': 7, 'm': 30, 's': 0, 'ms': 0 });
                    dateMax = moment({ 'h': 21, 'm': 30, 's': 0, 'ms': 0 });
                    if (moment().isAfter(moment({ h: 22, m: 0 })) || moment().isBefore(moment({ h: 8, m: 0 }))) {
                        dateDefault = '';
                    } else {
                        dateDefault = moment().get('m') > 30 ? moment({ h: moment().get('h'), m: 0, s: 0, ms: 0 }).add(1, 'h') : moment({ h: moment().get('h'), m: 0, s: 0, ms: 0 }).add(30, 'm');
                    }
                } else if (this.name === 'horaFim' && $('input[name=horaInicio]').val() !== '') {
                    dateMin = moment($('input[name=horaInicio]').val(), 'hh:mm');
                    dateMax = moment({ 'h': 21, 'm': 30, 's': 0, 'ms': 0 });
                    dateDefault = moment($('input[name=horaInicio]').val(), 'HH:mm').add(30, 'm');
                }
                ControlAgenda.horas = FLUIGC.calendar('[name=' + this.name + ']', {
                    language: 'pt-br',
                    pickDate: false,
                    pickTime: true,
                    useMinutes: true,
                    useSeconds: false,
                    useCurrent: false,
                    defaultDate: dateDefault,
                    minuteStepping: 30,
                    useStrict: true,
                    formatDate: 'HH:mm'
                });
                ControlAgenda.horas.setMinDate(dateMin);
                ControlAgenda.horas.setMaxDate(dateMax);
            }
        });
        $('body').on('blur', 'input[data-calendar].fs-no-bg', function (event) {
            if ($(this).data('calendar') === 'data' && this.name === 'dataInicio') {
                $('input[name=dataFim]').val('');
            } else if ($(this).data('calendar') === 'horas') {
                let horas = parseInt(this.value.replace(/:/g, ''));
                if (horas < 800 || horas > 2230) {
                    ControlAgenda.setToast('Atenção! ', 'Horário selecionado não atendo ao intervalo de atendimento, sendo das 08:00 às 22:00 horas.', 'danger', 4000)
                }
            }
        });
        //SETA O TEXTO DE DESCRIÇÃO INSERIDA PELO TECLADO EM UPPER CASE
        $('body').on('keyup', 'input[data-upper]', function (event) {
            event.preventDefault();
            $(this).val(($(this).val()).toUpperCase());
        });

        let roleIdLike = DatasetFactory.createConstraint("roleId", "WK_MED_", "WK_MED_", ConstraintType.MUST);
        roleIdLike._likeSearch = true;
        let usersRoles = DatasetFactory.getDataset("users_roles", null, [roleIdLike], null);
        for (let j = 0; j < usersRoles.values.length; j++) {
            let roleName = (usersRoles.values[j].roleId).split('_')[2];
            roleName = roleName === 'NUTRICAO' ? 'NUTRIÇÃO' : roleName;
            if (roleName !== 'Gestores' && roleName !== 'Gestor' && roleName !== 'ADMINISTRACAO' && roleName !== 'RECEPCAO') {
                if (!(ControlAgenda.myAutocomplete).includes(usersRoles.values[j].colleagueName)) {
                    (ControlAgenda.myAutocomplete).push(usersRoles.values[j].colleagueName)
                }
                if (this.arrayRoles.hasOwnProperty(roleName) == false) {
                    this.arrayRoles[roleName] = {
                        medico: [{
                            nome: usersRoles.values[j].colleagueName,
                            matricula: usersRoles.values[j].colleagueId
                        }]
                    }
                } else {
                    this.arrayRoles[roleName].medico.push({
                        nome: usersRoles.values[j].colleagueName,
                        matricula: usersRoles.values[j].colleagueId
                    });
                }
            }
        }
    },

    //BIND de eventos
    bindings: {
        local: {
            'datatable-add-insert': ['click_openModalInsert'],
            'datatable-add-delete': ['click_openModalCancel'],
        },
        global: {
            agendar: ['click_registrarCard'],
            cancel: ['click_resgistrarCancel'],
        }
    },

    //VALIDA FORMULÁRIO DO MODAL
    validarForm: function (data) {
        let requireds = $('div.modal-body').find('[' + data + ']:visible')
        let valida = false;
        $.each(requireds, function (index, val) {
            if ($(this).val() === '' || $(this).val() === null) {
                valida = true;
            }
        });
        return valida;
    },
    getDados: function (isProfessional) {
        let that = this;
        that.mydata = [];
        let filters = [];
        filters[0] = DatasetFactory.createConstraint('bloqueioCancelado', 'false', 'false', ConstraintType.MUST)
        filters[1] = DatasetFactory.createConstraint('arrayDates', '%' + that.date + '%', '%' + that.date + '%', ConstraintType.MUST);
        filters[1]._likeSearch = true;
        if (isProfessional && that.filterProfessional !== '') {
            filters[2] = DatasetFactory.createConstraint('profissional', that.filterProfessional, that.filterProfessional, ConstraintType.MUST);
        }
        //Requisição no banco
        let datasetReturned = DatasetFactory.getDataset("cadastro_restricoes", null, filters, ['profissional']);
        if (datasetReturned != null && datasetReturned.values != null && datasetReturned.values.length > 0) {
            var records = datasetReturned.values;
            for (var index in records) {
                var record = records[index];
                that.mydata.push({
                    documentid: record.documentid,
                    profissional: record.profissional,
                    dataInicial: record.dataInicial,
                    dataFinal: record.dataFinal,
                    horaInicial: record.horaInicial,
                    horaFinal: record.horaFinal
                });
            }
        };
    },
    //CALCULA A QUANTIDADE DE MEIA HORA QUE EXISTE NO INTERVALO E MONTA O ARRAY DE TDSCLASS
    calculaClasses: function (dataInicio, horaInicio, horaFim) {
        let tdsClass = [];
        let objDateInicio = moment((dataInicio + ' ' + horaInicio), "DD/MM/YYYY HH:mm");
        let ms = moment((dataInicio + ' ' + horaFim), "DD/MM/YYYY HH:mm").diff(objDateInicio);
        let d = moment.duration(ms);
        let intervaloHoras = Math.round((d._data.hours) * 2);
        d._data.minutes !== 0 ? intervaloHoras++ : intervaloHoras;
        objDateInicio = objDateInicio.toDate();
        for (var i = 0; i < intervaloHoras; i++) {
            let classe = moment(objDateInicio).add((30 * i), 'minutes').locale('pt-br').format('LT')
            tdsClass.push(classe.replace(':', ''));
        }
        return tdsClass;
    },
    loaderTable: function () {
        var that = this;
        that.date = that.date === undefined ? moment().locale('pt-br').format('L') : that.date;
        that.getDados(false);
        ControlAgenda.myTable = FLUIGC.datatable('#dataTable_' + that.instanceId, {
            dataRequest: that.mydata,
            renderContent: ['documentid', 'profissional', 'dataInicial', 'dataFinal', 'horaInicial', 'horaFinal'],
            limit: 40,
            header: [
                {
                    'title': 'DocumentId',
                    'display': false
                }, {
                    'title': 'Profissional',
                    'standard': true,
                    'size': 'col-md-5 text-center'
                }, {
                    'title': 'Data Início',
                    'size': 'col-md-1',
                }, {
                    'title': 'Data Fim',
                    'size': 'col-md-1',
                }, {
                    'title': 'Hora Início',
                    'size': 'col-md-1',
                }, {
                    'title': 'Hora Fim',
                    'size': 'col-md-1',
                }
            ],
            multiSelect: false,
            classSelected: 'info',
            search: {
                enabled: true,
                onlyEnterkey: true,
                searchAreaStyle: 'col-md-4 col-lg-4 col-xs-12 col-sm-12',
            },
            scroll: {
                enabled: true,
                target: '#dataTable_' + that.instanceId
            },
            actions: {
                enabled: true,
                template: '.ControlAgenda-template-row-area-buttons'
            },
            navButtons: {
                enabled: false,
                forwardstyle: 'btn-primary',
                backwardstyle: 'btn-primary',
            },
            draggable: {
                enabled: false
            },
        }, function (err, data) {
            if (err) {
                FLUIGC.toast({
                    message: err,
                    type: 'danger'
                });
            } else {
                $('table.table-datatable').addClass('table-bordered table-hover table-condesed');
                $('div#datatable-area').addClass('fs-no-padding');
                $('div#datatable-area-action').removeAttr('class');
                $('input[name=dateConsulta_' + that.instanceId + ']').val(that.date);
                that.setPropAutocomplete('fluig-data-table-input');

            }
        });
        that.myTable.on('fluig.datatable.search', function (ev, data) {
            that.date = $('input[name=dateConsulta_' + that.instanceId + ']').val();
            that.filterProfessional = data;
            that.getDados(true);
            that.myTable.reload(that.mydata);
        });
    },
    setPropAutocomplete: function (id) {
        ControlAgenda.categoriaAutocomplete = FLUIGC.autocomplete('#' + id, {
            source: substringMatcher(),
            name: 'dsProfissionais',
            displayKey: 'myAutocomplete',
            tagClass: 'tag-gray',
            type: 'tagAutocomplete',
            maxTags: 1,
            highlight: true
        });
        function substringMatcher() {
            return function findMatches(q, cb) {
                var matches, substrRegex;
                matches = [];
                substrRegex = new RegExp(q, 'i');
                $.each(ControlAgenda.myAutocomplete, function (i, str) {
                    if (substrRegex.test(str)) {
                        matches.push({
                            myAutocomplete: str
                        });
                    }
                });
                cb(matches);
            };
        }
    },
    //FAZ REQUISIÇÃO DOS DOC SUPORTE VIA AJAX PARA CONSUMO
    requestAJAX: function (arquivo, typeArquivo) {
        let aRetorno;
        $.ajax({
            url: '/ControlAgenda/resources/js/' + typeArquivo + 's/' + arquivo + '.' + typeArquivo,
            async: false,
            type: 'get',
            datatype: typeArquivo + ',charset=utf-8',
            success: function (retorno) {
                aRetorno = $(retorno);
            }
        });
        return aRetorno;
    },
    //CREATE TOAST IN WINDOW
    setToast: function (titulo, mensagem, tType, timeout) {
        FLUIGC.toast({
            title: titulo,
            message: mensagem,
            type: tType,
            timeout: timeout
        });
        if (tType === 'danger') {
            let qtd = $('div#toaster').find('div.alert').length;
            setTimeout(function () {
                let $obj = $('div#toaster').find('div.alert.alert-danger.alert-dismissible:eq(0)');
                $obj.slideUp('slow', function () {
                    $obj.remove();
                });
            }, qtd * timeout);
        }
    },
    openModalInsert: function (htmlElement, event) {
        let _html = ControlAgenda.requestAJAX('formCadastro', 'html');
        $('body').addClass('scroll-hidden');
        ControlAgenda.modalInsert = FLUIGC.modal({
            title: 'Inserir Restrição de Agendamento',
            content: $(_html[0]).html(),
            id: 'modal-insert',
            formModal: true,
            size: 'full',
            actions: [{
                'buttonType': 'button',
                'classType': 'btn-primary agendar'
            }, {
                'autoClose': true,
                'buttonType': 'button',
                'classType': 'btn-danger cancelar'
            }]
        }, function (err, data) {
            if (err === null) {
                $('body').removeClass('scroll-hidden');
                $('div#modal-insert button.btn-danger.cancelar').html('<i class="fluigicon fluigicon-remove"></i>&nbsp; Cancelar');
                $('div#modal-insert button.btn-primary.agendar').html('<i class="fluigicon fluigicon-calendar-verified"></i>&nbsp; Confirmar');
                $('div#modal-insert div.modal-header').find('button.close').remove();
                $('div#modal-insert button.btn-primary.agendar').attr({ 'type': 'button', 'DATA-agendar': '' });

                $('#modal-insert').on('hide.bs.modal', function (event) {
                    $('body').removeClass('scroll-hidden');
                });


                let arrayProp = Object.getOwnPropertyNames(ControlAgenda.arrayRoles);
                let optgroup, option;
                for (let k = 0; k < arrayProp.length; k++) {
                    optgroup = null;
                    for (let l = 0; l < ControlAgenda.arrayRoles[arrayProp[k]].medico.length; l++) {
                        let especialidade = (arrayProp[k]).toLowerCase().replace(/(?:^)\S/g, function (a) {
                            return a.toUpperCase();
                        })
                        optgroup = optgroup === null ? document.createElement("optgroup") : optgroup;
                        optgroup.setAttribute("label", especialidade);
                        option = document.createElement("option");
                        option.text = ControlAgenda.arrayRoles[arrayProp[k]].medico[l].nome;
                        option.value = ControlAgenda.arrayRoles[arrayProp[k]].medico[l].nome;
                        option.setAttribute("data-matricula", ControlAgenda.arrayRoles[arrayProp[k]].medico[l].matricula);
                        option.setAttribute("data-especialidade", (arrayProp[k]).toLowerCase());
                        option.setAttribute("data-tokens", (arrayProp[k] + ' ' + ControlAgenda.arrayRoles[arrayProp[k]].medico[l].nome + ' ' + ControlAgenda.arrayRoles[arrayProp[k]].medico[l].matricula));
                        optgroup.appendChild(option);
                    }
                    $('.selectpicker').append(optgroup);
                }
                $('.selectpicker').selectpicker('render');
            }
        });
    },
    openModalCancel: function (htmlElement, event) {
        if ($('table.table-datatable').find('tbody tr.info').length > 0) {
            $('body').addClass('scroll-hidden');
            let _html = ControlAgenda.requestAJAX('formCancel', 'html');
            ControlAgenda.modalCancel = FLUIGC.modal({
                title: 'Cancelar Restrição de Agendamento',
                content: $(_html[0]).html(),
                id: 'modal-cancel',
                formModal: true,
                size: 'large',
                actions: [{
                    'buttonType': 'button',
                    'classType': 'btn-primary cancelar'
                }, {
                    'autoClose': true,
                    'buttonType': 'button',
                    'classType': 'btn-danger fechar'
                }]
            }, function (err, data) {
                if (err === null) {
                    $('#modal-cancel').on('hide.bs.modal', function (event) {
                        $('body').removeClass('scroll-hidden');
                    });
                    $('div#modal-cancel button.btn-primary.cancelar').html('<i class="fluigicon fluigicon-checked"></i>&nbsp; Sim');
                    $('div#modal-cancel button.btn-danger.fechar').html('<i class="fluigicon fluigicon-remove"></i>&nbsp; Não');
                    $('div#modal-cancel button.btn-primary.cancelar').attr({ 'type': 'button', 'data-cancel': '' });
                    $('div#modal-cancel div.modal-header').find('button.close').remove();
                }
            });
        } else {
            ControlAgenda.setToast('Opss! ', 'Não foi identificado o registro a ser cancelado. Favor selecionar a linha na tabela.', 'warning', 4000);
        }
    },
    registrarCard: function () {
        ControlAgenda.loadInsert = FLUIGC.loading('div#modal-insert');
        ControlAgenda.loadInsert.show();
        var that = this;
        setTimeout(a => {
            var parser = new DOMParser();
            let horaInicio = $('div#modal-insert').find('input[name=horaInicio]').val();
            let horaFim = $('div#modal-insert').find('input[name=horaFim]').val();
            let dataInicial = $('div#modal-insert input[name=dataInicio]').val()
            let dataFim = $('div#modal-insert input[name=dataFim]').val();
            if (ControlAgenda.validarForm('data-required')) {
                ControlAgenda.setToast('Opss! ', 'Os campos sinalizados com * são de preenchimento obrigatório.', 'danger', 4000);
                ControlAgenda.loadInsert.hide();
            } else if (((parseInt(horaInicio.replace(':', '')) < 800 || parseInt(horaInicio.replace(':', '')) > 2230) && horaInicio !== '')) {
                ControlAgenda.setToast('Opss! ', 'O horário de ínicio da consulta deve respeitar o intervalo de atendimento, sendo das 08:00 às 22:00 horas e menor que o horário de término.', 'danger', 4000);
                ControlAgenda.loadInsert.hide();
                return false;
            } else if ((parseInt(horaFim.replace(':', '')) < 800 || parseInt(horaFim.replace(':', '')) > 2230) && horaFim !== '') {
                ControlAgenda.setToast('Opss! ', 'O horário de término da consulta deve respeitar o intervalo de atendimento, sendo das 08:00 às 22:00 horas e maior que o horário de ínicio.', 'danger', 4000);
                ControlAgenda.loadInsert.hide();
                return false;
            } else {
                let classes = ControlAgenda.calculaClasses(dataInicial, horaInicio, horaFim);
                let objLogMsg = { content: [] },
                    matricula = $('.selectpicker').find('option:selected').data('matricula'),
                    arrayDates = [],
                    loop = moment(dataFim, 'DD/MM/YYYY').diff(moment(dataInicial, 'DD/MM/YYYY'), 'd');
                filterCancel = DatasetFactory.createConstraint('consultaCancelada', 'false', 'false', ConstraintType.MUST),
                    filterMatricula = DatasetFactory.createConstraint('matMedico', matricula, matricula, ConstraintType.MUST);

                for (let i = 0; i <= loop; i++) {
                    let newDate = moment(dataInicial, 'DD/MM/YYYY').add(i, 'd').locale('pt-br').format('L'),
                        filterDate = DatasetFactory.createConstraint('dateInicio', newDate, newDate, ConstraintType.MUST),
                        ds_return = DatasetFactory.getDataset('agendamento_consultas', null, [filterMatricula, filterDate, filterCancel], null);
                    if (ds_return !== undefined && ds_return !== null && ds_return.values.length > 0) {
                        for (let j = 0; j < ds_return.values.length; j++) {
                            let inicioConsulta = parseInt((ds_return.values[j].tdClass).slice(0, 4));
                            let fimConsulta = parseInt((ds_return.values[j].tdClass).slice(-4));
                            if (parseInt(horaInicio.replace(/:/gi, '')) <= inicioConsulta && parseInt(horaFim.replace(/:/gi, '')) >= fimConsulta) {
                                objLogMsg.content.push({ data: newDate, descricao: ds_return.values[j].descricao });
                            } else if ((ds_return.values[j].tdClass).indexOf(horaInicio.replace(/:/gi, '')) > -1 || (ds_return.values[j].tdClass).indexOf(horaFim.replace(/:/gi, '')) > -1) {
                                objLogMsg.content.push({ data: newDate, descricao: ds_return.values[j].descricao });
                            } else {
                                arrayDates.push(newDate);
                            }
                        }
                    } else if (ds_return.values.length === 0) {
                        arrayDates.push(newDate);
                    }
                }

                if (objLogMsg.content.length > 0) {
                    let template = `{{#content}}
                                        <div class="alert alert-danger" role="alert">
                                        <strong><i class="icon-top fluigicon fluigicon-arrow-turn-right"></i>&nbsp;
                                        {{data}}</strong> {{descricao}}
                                    </div>{{/content}}`;
                    let contentHTML = Mustache.render(template, objLogMsg);
                    FLUIGC.modal({
                        title: 'Atenção!',
                        content: '<h3>No período selecionado, há consultas marcadas nos dias:</h3><br>' + contentHTML,
                        id: 'modal-mensage',
                        formModal: false,
                        size: 'large',
                    }, function (err, data) {
                        if (err === null) {
                            $('div#modal-mensage').on('hide.bs.modal', function () {
                                ControlAgenda.loadInsert.hide()
                            })
                        }
                    });
                } else {
                    let _xml = ControlAgenda.requestAJAX('ECMCardService_Create', 'xml');
                    _xml.find("companyId").text(ControlAgenda.tenantCode);
                    _xml.find("username").text(ControlAgenda.login);
                    _xml.find("password").text(ControlAgenda.password);
                    _xml.find('[name=bloqueioCancelado]').text(false);
                    _xml.find('[name=tdClass]').text(classes.toString());
                    _xml.find('[name=colorAgenda]').text('#e57373');
                    _xml.find('[name=matMedico]').text(matricula);
                    _xml.find('[name=profissional]').text($('.selectpicker').find('option:selected').val());
                    _xml.find('[name=descricao]').text($('.selectpicker').find('option:selected').val() + ' - ' + $('div#modal-insert input[name=motivo]').val());
                    _xml.find('[name=motivo]').text($('div#modal-insert input[name=motivo]').val());
                    _xml.find('[name=dataInicial]').text(dataInicial);
                    _xml.find('[name=dataFinal]').text(dataFim);
                    _xml.find('[name=horaInicial]').text($('div#modal-insert input[name=horaInicio]').val());
                    _xml.find('[name=horaFinal]').text($('div#modal-insert input[name=horaFim]').val());
                    _xml.find('[name=arrayDates]').text(arrayDates.toString());
                    _xml.find('[name=logAlteracao]').text(moment(new Date()).locale('pt-br').format('LLL') + ' - ' + WCMAPI.getUser() + ' - Restrição de agenda inserida com sucesso.');
                    _xml.find("parentDocumentId").text(ControlAgenda.parentId);

                    WCMAPI.Create({
                        url: ControlAgenda.urlService,
                        contentType: "text/xml,charset=utf-8",
                        async: false,
                        dataType: "xml",
                        data: _xml[0],
                        success: function (data) {
                            let xmlResp = parser.parseFromString(data.firstChild.innerHTML, "text/xml");
                            let retorno = parseInt(xmlResp.getElementsByTagName("documentId")[0].innerHTML);
                            if (retorno === 0) {
                                if ($('div#toaster').find('div.alert').length === 0) {
                                    ControlAgenda.setToast('Opss! ', xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML, 'danger', 4000);
                                }
                                ControlAgenda.loadInsert.hide();
                            } else if (retorno > 0) {
                                if ($('div#toaster').find('div.alert').length === 0) {
                                    ControlAgenda.setToast('Parabéns! ', 'Restrição cadastrada com sucesso.', 'success', 4000);
                                }
                                ControlAgenda.loadInsert.hide();
                                ControlAgenda.modalInsert.remove();
                                that.getDados(true);
                                that.myTable.reload(that.mydata);
                            }
                        }
                    });
                }
            }
        }, 100);
    },
    resgistrarCancel: function () {
        var that = this;
        ControlAgenda.loadCancel = FLUIGC.loading('div#modal-cancel');
        ControlAgenda.loadCancel.show()
        setTimeout(a => {
            if (ControlAgenda.validarForm('data-required')) {
                ControlAgenda.setToast('Opss! ', 'Os campos sinalizados com * são de preenchimento obrigatório.', 'danger', 4000);
                ControlAgenda.loadCancel.hide();
            } else {
                var parser = new DOMParser();
                let line = ControlAgenda.myTable.getRow(ControlAgenda.myTable.selectedRows()[0]);
                let filterDocument = DatasetFactory.createConstraint('documentid', line.documentid, line.documentid, ConstraintType.MUST);
                let ds_block = DatasetFactory.getDataset('cadastro_restricoes', null, [filterDocument], null);
                let _xml = ControlAgenda.requestAJAX('ECMCardService_Update', 'xml');
                let obj = ds_block.values[0]
                for (var prop in obj) {
                    _xml.find('[name="' + prop + '"]').text(obj[prop]);
                }
                _xml.find('[name=bloqueioCancelado]').text(true);
                _xml.find('[name="logAlteracao"]').text(moment().locale('pt-br').format('LLL') + ' - ' + WCMAPI.getUser() + ' - Restrição cancelada - ' + $('div#modal-cancel textarea[name=justificaCancel]').val() + '\n' + _xml.find('[name="logAlteracao"]').text())
                _xml.find("companyId").text(ControlAgenda.tenantCode);
                _xml.find("username").text(ControlAgenda.login);
                _xml.find("password").text(ControlAgenda.password);
                _xml.find("cardId").text(parseInt(line.documentid));
                //Enviando a requisição
                WCMAPI.Create({
                    url: ControlAgenda.urlService,
                    contentType: "text/xml,charset=utf-8",
                    dataType: "xml",
                    data: _xml[0],
                    success: function (data) {
                        let xmlResp = parser.parseFromString(data.firstChild.innerHTML, "text/xml");
                        let retorno = xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML;
                        if (retorno === 'ok') {
                            if ($('div#toaster').find('div.alert').length === 0) {
                                ControlAgenda.setToast('Parabéns!', 'Restrição cancelada com sucesso.', 'success', 4000);
                            }
                            ControlAgenda.loadCancel.hide();
                            ControlAgenda.modalCancel.remove();
                            that.getDados(true);
                            that.myTable.reload(that.mydata);
                        } else {
                            ControlAgenda.setToast('Opss! ', xmlResp.getElementsByTagName("webServiceMessage")[0].innerHTML, 'danger', 4000);
                            ControlAgenda.loadCancel.hide();
                        }
                    }
                });
            }
        }, 100);
    },
    getIds: function getIds() {
        /*  credenciais.login
         credenciais.matricula
         credenciais.password
         */
        var ds = DatasetFactory.getDataset("dsAutenticacao", null, null, null);
        ds = ds.values[0]["STR_OBJ"];
        var obj = JSON.parse(ds);
        return obj[0];

    }
});

