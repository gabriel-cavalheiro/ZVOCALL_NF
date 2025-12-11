sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/Token",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/core/util/Export",
    "sap/ui/core/util/ExportTypeCSV"
], function (Controller, JSONModel, Filter, FilterOperator, Token, MessageBox, MessageToast, Export, ExportTypeCSV) {
    "use strict";

    return Controller.extend("br.com.inbetta.zvocallnf.controller.Main", {

        onInit: function () {
            var oViewModel = new JSONModel({
                filtros: {
                    dataInicio: null,
                    dataFim: null,
                    nfNumeroDe: "",
                    nfNumeroAte: "",
                    empresas: [],
                    filiais: [],
                    cargaInicial: false
                },
                resultadoVisivel: false,
                resultado: {
                    Status: "",
                    Mensagem: "",
                    QuantidadeProcessada: 0,
                    DataProcessamento: null
                }
            });
            this.getView().setModel(oViewModel, "view");

            var oHelpModel = new JSONModel({
                empresas: [],
                filiais: []
            });
            this.getView().setModel(oHelpModel, "help");

            this._loadEmpresas();
            this._loadFiliais();
        },

        _loadEmpresas: function () {
            var oHelpModel = this.getView().getModel("help");
            var oODataModel = this.getOwnerComponent().getModel();

            oODataModel.read("/ZshBukrsSet", {
                success: function (oData) {
                    var aEmpresas = oData.results.map(function (oItem) {
                        return { key: oItem.Bukrs, text: oItem.Butxt };
                    });
                    oHelpModel.setProperty("/empresas", aEmpresas);
                },
                error: function () {
                    MessageBox.error("Erro ao carregar a lista de empresas do backend.");
                }
            });
        },

        _loadFiliais: function () {
            var oHelpModel = this.getView().getModel("help");
            var oODataModel = this.getOwnerComponent().getModel();

            oODataModel.read("/YpmtlBranchSet", {
                success: function (oData) {
                    var aFiliais = oData.results.map(function (oItem) {
                        return { key: oItem.Branch, text: oItem.Name };
                    });
                    oHelpModel.setProperty("/filiais", aFiliais);
                },
                error: function () {
                    MessageBox.error("Erro ao carregar a lista de filiais do backend.");
                }
            });
        },

        onValueHelpRequestBukrs: function () {
            if (!this._oValueHelpDialogBukrs) {
                this._oValueHelpDialogBukrs = sap.ui.xmlfragment("br.com.inbetta.zvocallnf.view.ValueHelpBukrs", this);
                this.getView().addDependent(this._oValueHelpDialogBukrs);
            }
            this._oValueHelpDialogBukrs.open();
        },

        onValueHelpSearchBukrs: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("text", FilterOperator.Contains, sValue);
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        onValueHelpCloseBukrs: function (oEvent) {
            var oMultiInput = this.byId("multiInputBukrs");
            var aSelectedItems = oEvent.getParameter("selectedItems");
            var oViewModel = this.getView().getModel("view");
            var aEmpresas = [];

            oMultiInput.removeAllTokens();
            if (aSelectedItems && aSelectedItems.length > 0) {
                aSelectedItems.forEach(function (oItem) {
                    var oContext = oItem.getBindingContext("help");
                    var sKey = oContext.getProperty("key");
                    var sText = oContext.getProperty("text");

                    oMultiInput.addToken(new Token({ key: sKey, text: sText }));
                    aEmpresas.push({ key: sKey, text: sText });
                });
            }
            oViewModel.setProperty("/filtros/empresas", aEmpresas);
        },

        onValueHelpRequestBranch: function () {
            if (!this._oValueHelpDialogBranch) {
                this._oValueHelpDialogBranch = sap.ui.xmlfragment("br.com.inbetta.zvocallnf.view.ValueHelpBranch", this);
                this.getView().addDependent(this._oValueHelpDialogBranch);
            }
            this._oValueHelpDialogBranch.open();
        },

        onValueHelpSearchBranch: function (oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("text", FilterOperator.Contains, sValue);
            oEvent.getSource().getBinding("items").filter([oFilter]);
        },

        onValueHelpCloseBranch: function (oEvent) {
            var oMultiInput = this.byId("multiInputBranch");
            var aSelectedItems = oEvent.getParameter("selectedItems");
            var oViewModel = this.getView().getModel("view");
            var aFiliais = [];

            oMultiInput.removeAllTokens();
            if (aSelectedItems && aSelectedItems.length > 0) {
                aSelectedItems.forEach(function (oItem) {
                    var oContext = oItem.getBindingContext("help");
                    var sKey = oContext.getProperty("key");
                    var sText = oContext.getProperty("text");

                    oMultiInput.addToken(new Token({ key: sKey, text: sText }));
                    aFiliais.push({ key: sKey, text: sText });
                });
            }
            oViewModel.setProperty("/filtros/filiais", aFiliais);
        },

        _formatDateToOData: function (oDate) {
            if (!oDate) return "";
            var sYear = oDate.getFullYear();
            var sMonth = ("0" + (oDate.getMonth() + 1)).slice(-2);
            var sDay = ("0" + oDate.getDate()).slice(-2);
            return sYear + sMonth + sDay + "000000";
        },

        onProcessar: function () {
            var oView = this.getView();
            var oViewModel = oView.getModel("view");
            var oFiltros = oViewModel.getProperty("/filtros");

            var bTemDataInicio = oFiltros.dataInicio !== null && oFiltros.dataInicio !== undefined;
            var bTemDataFim = oFiltros.dataFim !== null && oFiltros.dataFim !== undefined;
            var bTemNfNumeroDe = oFiltros.nfNumeroDe && oFiltros.nfNumeroDe.trim().length > 0;
            var bTemNfNumeroAte = oFiltros.nfNumeroAte && oFiltros.nfNumeroAte.trim().length > 0;
            var bTemEmpresas = oFiltros.empresas && oFiltros.empresas.length > 0;
            var bTemFiliais = oFiltros.filiais && oFiltros.filiais.length > 0;

            if (!bTemDataInicio && !bTemNfNumeroDe && !bTemNfNumeroAte && !bTemEmpresas && !bTemFiliais) {
                MessageBox.warning("Por favor, preencha pelo menos um filtro para processar.");
                return;
            }

            if (bTemDataInicio && !bTemDataFim) {
                MessageBox.warning("Por favor, preencha a data final ou deixe ambas em branco.");
                return;
            }
            if (!bTemDataInicio && bTemDataFim) {
                MessageBox.warning("Por favor, preencha a data inicial ou deixe ambas em branco.");
                return;
            }
            if (bTemDataInicio && bTemDataFim && oFiltros.dataInicio > oFiltros.dataFim) {
                MessageBox.error("A data inicial não pode ser maior que a data final.");
                return;
            }

            MessageToast.show("Iniciando processamento...");

            var sNfNumero = "";
            if (bTemNfNumeroDe && bTemNfNumeroAte) {
                sNfNumero = oFiltros.nfNumeroDe + "-" + oFiltros.nfNumeroAte;
            } else if (bTemNfNumeroDe) {
                sNfNumero = oFiltros.nfNumeroDe;
            } else if (bTemNfNumeroAte) {
                sNfNumero = oFiltros.nfNumeroAte;
            }

            var oPayload = {
                DataInicio: bTemDataInicio ? this._formatDateToOData(oFiltros.dataInicio) : "",
                DataFim: bTemDataFim ? this._formatDateToOData(oFiltros.dataFim) : "",
                NfNumero: sNfNumero,
                Bukrs: oFiltros.empresas.map(function (e) { return e.key; }).join(","),
                Branch: oFiltros.filiais.map(function (f) { return f.key; }).join(","),
                CargaInicial: oFiltros.cargaInicial ? "true" : "false"
            };

            this._callFunctionImport(oPayload);
        },

        _callFunctionImport: function (oPayload) {
            var oODataModel = this.getOwnerComponent().getModel();
            var oViewModel = this.getView().getModel("view");

            oODataModel.create("/ProcessarNotasSet", oPayload, {
                success: function (oData, oResponse) {
                    var iStatusCode = oResponse.statusCode;

                    var oResult = {
                        Status: oData.Status,
                        Mensagem: oData.Mensagem,
                        QuantidadeProcessada: parseInt(oData.QuantidadeProcessada) || 0,
                        DataProcessamento: oData.DataProcessamento
                    };

                    oViewModel.setProperty("/resultado", oResult);
                    oViewModel.setProperty("/resultadoVisivel", true);

                    if (iStatusCode === 201 && oData.Status === 'Sucesso') {
                        MessageToast.show("Processamento concluído com sucesso!");
                    } else if (iStatusCode === 204 || oData.Status === 'Aviso') {
                        MessageBox.warning(oData.Mensagem);
                    } else {
                        MessageBox.error(oData.Mensagem);
                    }
                },
                error: function (oError) {
                    var sErrorMessage = "Erro ao comunicar com o backend.";
                    try {
                        var oErrorResponse = JSON.parse(oError.responseText);
                        sErrorMessage = oErrorResponse.error.message.value;
                    } catch (e) {
                        // Ignorar erro de parsing
                    }
                    MessageBox.error(sErrorMessage);
                    oViewModel.setProperty("/resultadoVisivel", false);
                }
            });
        },

        onLimpar: function () {
            var oView = this.getView();
            var oViewModel = oView.getModel("view");

            this.byId("multiInputBukrs").removeAllTokens();
            this.byId("multiInputBranch").removeAllTokens();

            oViewModel.setData({
                filtros: {
                    dataInicio: null,
                    dataFim: null,
                    nfNumeroDe: "",
                    nfNumeroAte: "",
                    empresas: [],
                    filiais: [],
                    cargaInicial: false
                },
                resultadoVisivel: false,
                resultado: {
                    Status: "",
                    Mensagem: "",
                    QuantidadeProcessada: 0,
                    DataProcessamento: null
                }
            });

            MessageToast.show("Filtros limpos com sucesso!");
        }

    });
});