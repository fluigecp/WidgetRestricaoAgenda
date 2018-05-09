<script type="text/javascript" src="/webdesk/vcXMLRPC.js"></script>
<div id="ControlAgenda_${instanceId}" class="super-widget wcm-widget-class fluig-style-guide" data-params="ControlAgenda.instance()">
    <div class="container-fluid">
        <script type="text/template" class="ControlAgenda-template-row-area-buttons">
            <div class="col-xs-12 col-sm-12 col-md-6 col-lg-6">
                <div class="btn-group">
                    <button type="button" class="btn btn-primary dropdown-toggle" data-toggle="dropdown">Opções <span class="caret"></span></button>
                    <ul class="dropdown-menu" role="menu">
                        <li data-datatable-add-insert><a href="#"><i class="fluigicon fluigicon-plus"></i>&nbsp;Adicionar Restrição</a></li>
                        <li data-datatable-add-delete><a href="#"><i class="fluigicon fluigicon-remove"></i>&nbsp;Remover Restrição</a></li>
                    </ul>
                </div>
            </div>
            <div class="col-xs-12 col-sm-12 col-md-2 col-lg-2">
                <div class="form-field" data-type="textbox" data-show-properties="" data-field-name="dateConsulta_${instanceId}">
                    <div class="form-input">
                        <div class="form-group">
                            <input name="dateConsulta_${instanceId}" id="dateConsulta_${instanceId}" data-calendar="data" class="form-control fs-no-bg" type="text" placeholder="Inserir data de pesquisa" value="" data-size="big" readonly>
                        </div>
                    </div>
                </div>
            </div>
        </script>
        <!-- SEPARADOR -->
        <div class="row">
            <div class="col-xs-12 cl-sm-12 col-md-12 col-lg-12">
                <br>
                <legend></legend>
            </div>
        </div>
        <!-- TABELA DE RESTRIÇÕES -->
        <div class="row">
            <div class="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                <div id="dataTable_${instanceId}"></div>
            </div>
        </div>
    </div>
</div>