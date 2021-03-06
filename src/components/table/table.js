(function(){
    'use strict';

    angular.module('material.components.table', ['mdtTemplates', 'ngMaterial', 'ngMdIcons']);
}());
(function(){
    'use strict';

    function mdtAlternateHeadersDirective(){
        return {
            restrict: 'E',
            templateUrl: '/main/templates/mdtAlternateHeaders.html',
            transclude: true,
            replace: true,
            scope: true,
            require: ['^mdtTable'],
            link: function($scope){
                $scope.deleteSelectedRows = deleteSelectedRows;

                function deleteSelectedRows(){
                    var deletedRows = $scope.tableDataStorageService.deleteSelectedRows();

                    $scope.deleteRowCallback({rows: deletedRows});
                }
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtAlternateHeaders', mdtAlternateHeadersDirective);
}());
(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtTable
     * @restrict E
     *
     * @description
     * The base HTML tag for the component.
     *
     * @param {object=} tableCard when set table will be embedded within a card, with data manipulation tools available
     *      at the top and bottom.
     *
     *      Properties:
     *
     *      - `{boolean=}` `visible` - enable/disable table card explicitly
     *      - `{string}` `title` - the title of the card
     *      - `{array=}` `actionIcons` - (not implemented yet)
     *
     * @param {boolean=} selectableRows when set each row will have a checkbox
     * @param {String=} alternateHeaders some table cards may require headers with actions instead of titles.
     *      Two possible approaches to this are to display persistent actions, or a contextual header that activates
     *      when items are selected
     *
     *      Assignable values are:
     *
     *      - 'contextual' - when set table will have kind of dynamic header. E.g.: When selecting rows, the header will
     *        change and it'll show the number of selected rows and a delete icon on the right.
     *      - 'persistentActions' - (not implemented yet)
     *
     * @param {boolean=} sortableColumns sort data and display a sorted state in the header. Clicking on a column which
     *      is already sorted will reverse the sort order and rotate the sort icon.
     *      (not implemented yet: Use `sortable-rows-default` attribute directive on a column which intended to be the
     *      default sortable column)
     *
     * @param {function(rows)=} deleteRowCallback callback function when deleting rows.
     *      At default an array of the deleted row's data will be passed as the argument.
     *      When `table-row-id` set for the deleted row then that value will be passed.
     *
     * @param {boolean=} animateSortIcon sort icon will be animated on change
     * @param {boolean=} rippleEffect ripple effect will be applied on the columns when clicked (not implemented yet)
     * @param {boolean=} paginatedRows if set then basic pagination will applied to the bottom of the table.
     *
     *      Properties:
     *
     *      - `{boolean=}` `isEnabled` - enables pagination
     *      - `{array}` `rowsPerPageValues` - set page sizes. Example: [5,10,20]
     *
     * @param {object=} mdtRow passing rows data through this attribute will initialize the table with data. Additional
     *      benefit instead of using `mdt-row` element directive is that it makes possible to listen on data changes.
     *
     *      Properties:
     *
     *      - `{array}` `data` - the input data for rows
     *      - `{integer|string=}` `table-row-id-key` - the uniq identifier for a row
     *      - `{array}` `column-keys` - specifying property names for the passed data array. Makes it possible to
     *        configure which property assigned to which column in the table. The list should provided at the same order
     *        as it was specified inside `mdt-header-row` element directive.
     *
     * @param {function(page, pageSize)=} mdtRowPaginator providing the data for the table by a function. Should set a
     *      function which returns a promise when it's called. When the function is called, these parameters will be
     *      passed: `page` and `pageSize` which can help implementing an ajax-based paging.
     *
     * @param {string=} mdtRowPaginatorErrorMessage overrides default error message when promise gets rejected by the
     *      paginator function.
     *
     *
     * @example
     * <h2>`mdt-row` attribute:</h2>
     *
     * When column names are: `Product name`, `Creator`, `Last Update`
     * The passed data row's structure: `id`, `item_name`, `update_date`, `created_by`
     *
     * Then the following setup will parese the data to the right columns:
     * <pre>
     *     <mdt-table
     *         mdt-row="{
     *             'data': controller.data,
     *             'table-row-id-key': 'id',
     *             'column-keys': ['item_name', 'update_date', 'created_by']
     *         }">
     *
     *         <mdt-header-row>
     *             <mdt-column>Product name</mdt-column>
     *             <mdt-column>Creator</mdt-column>
     *             <mdt-column>Last Update</mdt-column>
     *         </mdt-header-row>
     *     </mdt-table>
     * </pre>
     */
    function mdtTableDirective(TableDataStorageFactory, mdtPaginationHelperFactory, mdtAjaxPaginationHelperFactory, $timeout, $window) {
        return {
            restrict: 'E',
            templateUrl: '/main/templates/mdtTable.html',
            transclude: true,
            replace: true,
            scope: {
                tableCard: '=',
                selectableRows: '=',
                alternateHeaders: '=',
                sortableColumns: '=',
                deleteRowCallback: '&',
                animateSortIcon: '=',
                rippleEffect: '=',
                paginatedRows: '=',
                mdtModel: '=',
                mdtSelectFn: '&',
                mdtDblclickFn: '&',
                mdtRow: '=',
                mdtRowPaginator: '&?',
                mdtRowPaginatorErrorMessage: "@"
            },
            controller: function ($scope) {
                var vm = this;
                vm.addHeaderCell = addHeaderCell;

                initTableStorageServiceAndBindMethods();

                function initTableStorageServiceAndBindMethods() {
                    $scope.tableDataStorageService = TableDataStorageFactory.getInstance();

                    if (!$scope.mdtRowPaginator) {
                        $scope.mdtPaginationHelper = mdtPaginationHelperFactory
                            .getInstance($scope.tableDataStorageService, $scope.paginatedRows, $scope.mdtRow);
                    } else {
                        $scope.mdtPaginationHelper = mdtAjaxPaginationHelperFactory.getInstance({
                            tableDataStorageService: $scope.tableDataStorageService,
                            paginationSetting: $scope.paginatedRows,
                            mdtRowOptions: $scope.mdtRow,
                            mdtRowPaginatorFunction: $scope.mdtRowPaginator,
                            mdtRowPaginatorErrorMessage: $scope.mdtRowPaginatorErrorMessage
                        });
                    }

                    vm.addRowData = _.bind($scope.tableDataStorageService.addRowData, $scope.tableDataStorageService);

                    var unbindWatchMdtModel = $scope.$watch('mdtModel', function (data) {
                        //if (data) {
                            //$scope.tableDataStorageService.initModel(data, $scope.mdtSelectFn, $scope.mdtDblclickFn);

                            $scope.$watchCollection('mdtModel.data', function (data) {
                                if (data) {
                                    $scope.tableDataStorageService.initModel($scope.mdtModel, $scope.mdtSelectFn, $scope.mdtDblclickFn);
                                }
                            });

                            unbindWatchMdtModel();
                        //}
                    });
                }


                function addHeaderCell(ops) {
                    $scope.tableDataStorageService.addHeaderCellData(ops);
                }
            },
            link: function ($scope, element, attrs, ctrl, transclude) {
                injectContentIntoTemplate();

                $scope.isAnyRowSelected = _.bind($scope.tableDataStorageService.isAnyRowSelected, $scope.tableDataStorageService);
                $scope.isPaginationEnabled = isPaginationEnabled;



/*
                function watchAnalytics() {
                    $timeout(function() {
                        var watchers = ($scope.$$watchers) ? $scope.$$watchers.length : 0;
                        var child = $scope.$$childHead;
                        while (child) {
                            watchers += (child.$$watchers) ? child.$$watchers.length : 0;
                            child = child.$$nextSibling;
                        }
                        console.log('watchers: '+ watchers);
                        watchAnalytics();
                    },1000);

                }
                watchAnalytics();
*/
                $scope.hiddenHeadHeight = function () {
                    return -$('#hiddenHead', element).height() || 0 ;
                };


                $scope.hiddenBodyHeight = function () {
                    return -$('#hiddenBody', element).height();
                };

                function watiForHeight() {
                    var height = $scope.hiddenHeadHeight();

                    if(!height) {
                        $timeout(function() {
                            watiForHeight();
                        });
                    } else {
                        $('#data-table', element).css('margin-top', height);
                    }

                }
                watiForHeight();

                if (!_.isEmpty($scope.mdtRow)) {
                    //local search/filter
                    if (angular.isUndefined(attrs.mdtRowPaginator)) {
                        $scope.$watch('mdtRow', function (mdtRow) {
                            $scope.tableDataStorageService.storage = [];

                            addRawDataToStorage(mdtRow['data']);
                        }, true);


                    } else {
                        //if it's used for 'Ajax pagination'
                    }
                }

                function addRawDataToStorage(data) {
                    var rowId;
                    var columnValues = [];
                    _.each(data, function (row) {
                        rowId = _.get(row, $scope.mdtRow['table-row-id-key']);
                        columnValues = [];

                        _.each($scope.mdtRow['column-keys'], function (columnKey) {
                            columnValues.push(_.get(row, columnKey));
                        });

                        $scope.tableDataStorageService.addRowData(rowId, columnValues);
                    });
                }

                function isPaginationEnabled() {
                    if ($scope.paginatedRows === true || ($scope.paginatedRows && $scope.paginatedRows.hasOwnProperty('isEnabled') && $scope.paginatedRows.isEnabled === true)) {
                        return true;
                    }

                    return false;
                }

                function injectContentIntoTemplate() {
                    transclude(function (clone) {
                        var headings = [];
                        var body = [];

                        _.each(clone, function (child) {
                            var $child = angular.element(child);

                            if ($child.hasClass('theadTrRow')) {
                                headings.push($child);
                            } else {
                                body.push($child);
                            }
                        });

                        element.find('#reader').append(headings).append(body);
                    });
                }
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtTable', mdtTableDirective);
}());
(function () {
    'use strict';

    function TableDataStorageFactory($log) {

        function TableDataStorageService() {
            this.srcModel = {};
            this.storage = [];
            this.header = [];
            this.maxRow = {data: {}};
            this.maxWidth = {};

            this.sortByColumnLastIndex = null;
            this.orderByAscending = true;
        }

        TableDataStorageService.prototype.initModel = function (mdtModel, selectCbFn, dblClickCbFn) {
            this.storage = [];
            this.maxRow = {data: {}};
            this.maxWidth = {};

            this.selectCbFn = selectCbFn;
            this.dblClickCbFn = dblClickCbFn;
            var _header = this.header = mdtModel.headers;
            var _storage = this.storage;
            var _maxRow = this.maxRow.data;
            var _maxWidth = this.maxWidth;

            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            //context.font = font;

            mdtModel.data.forEach(function (item) {

                _header.forEach(function (header) {
                    var _value = item[header.id];
                    var metrics = context.measureText(_value);
                    var _width = metrics.width;

                    if (!_maxRow[header.id]) {
                        _maxRow[header.id] = _value;
                        _maxWidth[header.id] = _width;
                    } else if (_maxWidth[header.id] < _width) {
                        _maxRow[header.id] = _value;
                        _maxWidth[header.id] = _width;
                    }
                });


                var id = item.id;
                _storage.push({
                    rowId: item.id,
                    optionList: {
                        selected: false,
                        deleted: false,
                        visible: true
                    },
                    data: item
                });
                delete item.id;
            });
        };
        TableDataStorageService.prototype.addHeaderCellData = function (ops) {
            this.header.push(ops);
        };

        TableDataStorageService.prototype.addRowData = function (explicitRowId, rowArray) {
            if (!(rowArray instanceof Array)) {
                $log.error('`rowArray` parameter should be array');
                return;
            }

            this.storage.push({
                rowId: explicitRowId,
                optionList: {
                    selected: false,
                    deleted: false,
                    visible: true
                },
                data: rowArray
            });
        };

        TableDataStorageService.prototype.getRowData = function (index) {
            if (!this.storage[index]) {
                $log.error('row is not exists at index: ' + index);
                return;
            }

            return this.storage[index].data;
        };

        TableDataStorageService.prototype.getRowOptions = function (index) {
            if (!this.storage[index]) {
                $log.error('row is not exists at index: ' + index);
                return;
            }

            return this.storage[index].optionList;
        };

        TableDataStorageService.prototype.setAllRowsSelected = function (isSelected, isPaginationEnabled) {
            if (typeof isSelected === 'undefined') {
                $log.error('`isSelected` parameter is required');
                return;
            }

            _.each(this.storage, function (rowData) {
                if (isPaginationEnabled) {
                    if (rowData.optionList.visible) {
                        rowData.optionList.selected = isSelected ? true : false;
                    }
                } else {
                    rowData.optionList.selected = isSelected ? true : false;
                }
            });
        };

        TableDataStorageService.prototype.reverseRows = function () {
            this.storage.reverse();
        };

        TableDataStorageService.prototype.sortByColumn = function (columnIndex, iteratee) {
            if (this.sortByColumnLastIndex === columnIndex) {
                this.reverseRows();

                this.orderByAscending = !this.orderByAscending;
            } else {
                this.sortByColumnIndex(columnIndex, iteratee);

                this.sortByColumnLastIndex = columnIndex;
                this.orderByAscending = true;
            }

            return this.orderByAscending ? -1 : 1;
        };

        TableDataStorageService.prototype.sortByColumnIndex = function (index, iteratee) {

            var sortFunction;
            if (typeof iteratee === 'function') {
                sortFunction = function (rowData) {
                    return iteratee(rowData.data[index], rowData, index);
                };
            } else {
                var id = this.header[index] ? this.header[index].id : undefined;
                sortFunction = function (rowData) {

                    return rowData.data[id || index];
                };
            }

            this.storage = _.sortBy(this.storage, sortFunction);
        };

        TableDataStorageService.prototype.isAnyRowSelected = function () {
            return _.some(this.storage, function (rowData) {
                return rowData.optionList.selected === true && rowData.optionList.deleted === false;
            });
        };

        TableDataStorageService.prototype.getNumberOfSelectedRows = function () {
            var res = _.countBy(this.storage, function (rowData) {
                return rowData.optionList.selected === true && rowData.optionList.deleted === false ? 'selected' : 'unselected';
            });

            return res.selected ? res.selected : 0;
        };

        TableDataStorageService.prototype.deleteSelectedRows = function () {
            var deletedRows = [];

            _.each(this.storage, function (rowData) {
                if (rowData.optionList.selected && rowData.optionList.deleted === false) {

                    if (rowData.rowId) {
                        deletedRows.push(rowData.rowId);

                        //Fallback when no id was specified
                    } else {
                        deletedRows.push(rowData.data);
                    }

                    rowData.optionList.deleted = true;
                }
            });

            return deletedRows;
        };

        return {
            getInstance: function () {
                return new TableDataStorageService();
            }
        };
    }

    angular
        .module('material.components.table')
        .factory('TableDataStorageFactory', TableDataStorageFactory);
}());
(function(){
    'use strict';

    function mdtAjaxPaginationHelperFactory(){

        function mdtAjaxPaginationHelper(params){
            this.tableDataStorageService = params.tableDataStorageService;
            this.rowOptions = params.mdtRowOptions;
            this.paginatorFunction = params.mdtRowPaginatorFunction;
            this.mdtRowPaginatorErrorMessage = params.mdtRowPaginatorErrorMessage || 'Ajax error during loading contents.';

            if(params.paginationSetting &&
                params.paginationSetting.hasOwnProperty('rowsPerPageValues') &&
                params.paginationSetting.rowsPerPageValues.length > 0){

                this.rowsPerPageValues = params.paginationSetting.rowsPerPageValues;
            }else{
                this.rowsPerPageValues = [10,20,30,50,100];
            }

            this.rowsPerPage = this.rowsPerPageValues[0];
            this.page = 1;
            this.totalResultCount = 0;
            this.totalPages = 0;

            this.isLoading = false;

            //fetching the 1st page
            this.fetchPage(this.page);
        }

        mdtAjaxPaginationHelper.prototype.getStartRowIndex = function(){
            return (this.page-1) * this.rowsPerPage;
        };

        mdtAjaxPaginationHelper.prototype.getEndRowIndex = function(){
            return this.getStartRowIndex() + this.rowsPerPage-1;
        };

        mdtAjaxPaginationHelper.prototype.getTotalRowsCount = function(){
            return this.totalPages;
        };

        mdtAjaxPaginationHelper.prototype.getRows = function(){
            return this.tableDataStorageService.storage;
        };

        mdtAjaxPaginationHelper.prototype.previousPage = function(){
            var that = this;
            if(this.page > 1){
                this.fetchPage(this.page-1).then(function(){
                    that.page--;
                });
            }
        };

        mdtAjaxPaginationHelper.prototype.nextPage = function(){
            var that = this;
            if(this.page < this.totalPages){
                this.fetchPage(this.page+1).then(function(){
                    that.page++;
                });
            }
        };

        mdtAjaxPaginationHelper.prototype.fetchPage = function(page){
            this.isLoading = true;

            var that = this;

            return this.paginatorFunction({page: page, pageSize: this.rowsPerPage})
                .then(function(data){
                    that.tableDataStorageService.storage = [];
                    that.setRawDataToStorage(that, data.results, that.rowOptions['table-row-id-key'], that.rowOptions['column-keys']);
                    that.totalResultCount = data.totalResultCount;
                    that.totalPages = Math.ceil(data.totalResultCount / that.rowsPerPage);

                    that.isLoadError = false;
                    that.isLoading = false;

                }, function(){
                    that.tableDataStorageService.storage = [];

                    that.isLoadError = true;
                    that.isLoading = false;
                });
        };

        mdtAjaxPaginationHelper.prototype.setRawDataToStorage = function(that, data, tableRowIdKey, columnKeys){
            var rowId;
            var columnValues = [];
            _.each(data, function(row){
                rowId = _.get(row, tableRowIdKey);
                columnValues = [];

                _.each(columnKeys, function(columnKey){
                    columnValues.push(_.get(row, columnKey));
                });

                that.tableDataStorageService.addRowData(rowId, columnValues);
            });
        };

        mdtAjaxPaginationHelper.prototype.setRowsPerPage = function(rowsPerPage){
            this.rowsPerPage = rowsPerPage;
            this.page = 1;

            this.fetchPage(this.page);
        };

        return {
            getInstance: function(tableDataStorageService, isEnabled, paginatorFunction, rowOptions){
                return new mdtAjaxPaginationHelper(tableDataStorageService, isEnabled, paginatorFunction, rowOptions);
            }
        };
    }

    angular
        .module('material.components.table')
        .service('mdtAjaxPaginationHelperFactory', mdtAjaxPaginationHelperFactory);
}());
(function () {
    'use strict';

    function mdtPaginationHelperFactory() {

        function mdtPaginationHelper(tableDataStorageService, paginationSetting) {
            this.tableDataStorageService = tableDataStorageService;

            if (paginationSetting &&
                paginationSetting.hasOwnProperty('rowsPerPageValues') &&
                paginationSetting.rowsPerPageValues.length > 0) {

                this.rowsPerPageValues = paginationSetting.rowsPerPageValues;
            } else {
                this.rowsPerPageValues = [10, 20, 30, 50, 100];
            }

            this.rowsPerPage = this.rowsPerPageValues[0];
            this.page = 1;
        }

        mdtPaginationHelper.prototype.calculateVisibleRows = function () {
            var that = this;

            _.each(this.tableDataStorageService.storage, function (rowData, index) {
                if (index >= that.getStartRowIndex() && index <= that.getEndRowIndex()) {
                    rowData.optionList.visible = true;
                } else {
                    rowData.optionList.visible = false;
                }
            });
        };

        mdtPaginationHelper.prototype.getStartRowIndex = function () {
            return (this.page - 1) * this.rowsPerPage;
        };

        mdtPaginationHelper.prototype.getEndRowIndex = function () {
            return this.getStartRowIndex() + this.rowsPerPage - 1;
        };

        mdtPaginationHelper.prototype.getTotalRowsCount = function () {
            return this.tableDataStorageService.storage.length;
        };

        mdtPaginationHelper.prototype.dblclick = function (rowData) {
            this.tableDataStorageService.dblClickCbFn({rowData: rowData});
        };

        mdtPaginationHelper.prototype.selectRow = function (rowData) {
            rowData.optionList.selected = true;


            if (this.tableDataStorageService.selectedRow && rowData != this.tableDataStorageService.selectedRow) {
                this.tableDataStorageService.selectedRow.optionList.selected = false;
            }
            this.tableDataStorageService.selectedRow = rowData;
            this.tableDataStorageService.selectCbFn({rowData: rowData});

        };

        mdtPaginationHelper.prototype.getRows = function () {
            this.calculateVisibleRows();

            return this.tableDataStorageService.storage;
        };

        mdtPaginationHelper.prototype.previousPage = function () {
            if (this.page > 1) {
                this.page--;
            }
        };

        mdtPaginationHelper.prototype.nextPage = function () {
            var totalPages = Math.ceil(this.getTotalRowsCount() / this.rowsPerPage);

            if (this.page < totalPages) {
                this.page++;
            }
        };

        mdtPaginationHelper.prototype.setRowsPerPage = function (rowsPerPage) {
            this.rowsPerPage = rowsPerPage;
            this.page = 1;
        };

        return {
            getInstance: function (tableDataStorageService, isEnabled) {
                return new mdtPaginationHelper(tableDataStorageService, isEnabled);
            }
        };
    }

    angular
        .module('material.components.table')
        .service('mdtPaginationHelperFactory', mdtPaginationHelperFactory);
}());
(function(){
    'use strict';

    function ColumnAlignmentHelper(ColumnOptionProvider){
        var service = this;
        service.getColumnAlignClass = getColumnAlignClass;

        function getColumnAlignClass(alignRule) {
            if (alignRule === ColumnOptionProvider.ALIGN_RULE.ALIGN_RIGHT) {
                return 'rightAlignedColumn';
            } else {
                return 'leftAlignedColumn';
            }
        }
    }

    angular
        .module('material.components.table')
        .service('ColumnAlignmentHelper', ColumnAlignmentHelper);
}());
(function(){
    'use strict';

    var ColumnOptionProvider = {
        ALIGN_RULE : {
            ALIGN_LEFT: 'left',
            ALIGN_RIGHT: 'right'
        }
    };

    angular.module('material.components.table')
        .value('ColumnOptionProvider', ColumnOptionProvider);
})();
(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtCell
     * @restrict E
     * @requires mdtTable
     * @requires mdtRow
     *
     * @description
     * Representing a cell which should be placed inside `mdt-row` element directive.
     *
     * @param {boolean=} htmlContent if set to true, then html content can be placed into the content of the directive.
     *
     * @example
     * <pre>
     *  <mdt-table>
     *      <mdt-header-row>
     *          <mdt-column>Product name</mdt-column>
     *          <mdt-column>Price</mdt-column>
     *          <mdt-column>Details</mdt-column>
     *      </mdt-header-row>
     *
     *      <mdt-row ng-repeat="product in ctrl.products">
     *          <mdt-cell>{{product.name}}</mdt-cell>
     *          <mdt-cell>{{product.price}}</mdt-cell>
     *          <mdt-cell html-content="true">
     *              <a href="productdetails/{{product.id}}">more details</a>
     *          </mdt-cell>
     *      </mdt-row>
     *  </mdt-table>
     * </pre>
     */
    function mdtCellDirective($parse, $compile) {
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            require: '^mdtRow',
            link: function ($scope, element, attr, mdtRowCtrl, transclude) {

                transclude(function (clone) {
                    //TODO: rework, figure out something for including html content
                    //scope.$watch($sce.parseAsHtml(attr.htmlContent), function(value) {
                    //
                    //});
                    if (attr.htmlContent) {
                        var value = $parse(attr.sortVal)($scope.$parent);
                        mdtRowCtrl.addToRowDataStorage(value, clone, 'htmlContent');
                    } else {
                        //TODO: better idea?
                        var value = $parse(attr.sortVal)($scope.$parent);
                        var cellValue = $parse(clone.html().replace('{{', '').replace('}}', ''))($scope.$parent);
                        if (value) {
                            mdtRowCtrl.addToRowDataStorage(value, cellValue, 'textContent');
                        } else {
                            mdtRowCtrl.addToRowDataStorage(cellValue);
                        }
                    }
                });
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtCell', mdtCellDirective);
}());
(function () {
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtRow
     * @restrict E
     * @requires mdtTable
     *
     * @description
     * Representing a row which should be placed inside `mdt-table` element directive.
     *
     * <i>Please note the following: This element has limited functionality. It cannot listen on data changes that happens outside of the
     * component. E.g.: if you provide an ng-repeat to generate your data rows for the table, using this directive,
     * it won't work well if this data will change. Since the way how transclusions work, it's (with my best
     * knowledge) an impossible task to solve at the moment. If you intend to use dynamic data rows, it's still
     * possible with using mdtRow attribute of mdtTable.</i>
     *
     * @param {string|integer=} tableRowId when set table will have a uniqe id. In case of deleting a row will give
     *      back this id.
     *
     * @example
     * <pre>
     *  <mdt-table>
     *      <mdt-header-row>
     *          <mdt-column>Product name</mdt-column>
     *          <mdt-column>Price</mdt-column>
     *      </mdt-header-row>
     *
     *      <mdt-row
     *          ng-repeat="product in products"
     *          table-row-id="{{product.id}}">
     *          <mdt-cell>{{product.name}}</mdt-cell>
     *          <mdt-cell>{{product.price}}</mdt-cell>
     *      </mdt-row>
     *  </mdt-table>
     * </pre>
     */
    function mdtRowDirective() {
        return {
            restrict: 'E',
            transclude: true,
            require: '^mdtTable',
            scope: {
                tableRowId: '='
            },
            controller: function ($scope) {
                var vm = this;

                vm.addToRowDataStorage = addToRowDataStorage;
                $scope.rowDataStorage = [];

                function addToRowDataStorage(value, content, contentType) {
                    if (contentType === 'htmlContent') {
                        $scope.rowDataStorage.push({value: value, content: content, type: 'html'});
                    } else if (contentType === 'textContent') {
                        $scope.rowDataStorage.push({value: value, content: content, type: 'text'});
                    } else {
                        $scope.rowDataStorage.push(value);
                    }
                }
            },
            link: function ($scope, element, attrs, ctrl, transclude) {
                appendColumns();

                ctrl.addRowData($scope.tableRowId, $scope.rowDataStorage);

                function appendColumns() {
                    transclude(function (clone) {
                        element.append(clone);
                    });
                }
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtRow', mdtRowDirective);
}());
(function(){
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtColumn
     * @restrict E
     * @requires mdtTable
     *
     * @description
     * Representing a header column cell which should be placed inside `mdt-header-row` element directive.
     *
     * @param {string=} alignRule align cell content. This settings will have affect on each data cells in the same
     *  column (e.g. every x.th cell in every row).
     *
     *  Assignable values:
     *    - 'left'
     *    - 'right'
     *
     * @param {function()=} sortBy compareFunction callback for sorting the column data's. As every compare function,
     *  should get two parameters and return with the comapred result (-1,1,0)
     *
     * @param {string=} columnDefinition displays a tooltip on hover.
     *
     * @example
     * <pre>
     *  <mdt-table>
     *      <mdt-header-row>
     *          <mdt-column align-rule="left">Product name</mdt-column>
     *          <mdt-column
     *              align-rule="right"
     *              column-definition="The price of the product in gross.">Price</mdt-column>
     *      </mdt-header-row>
     *
     *      <mdt-row ng-repeat="product in ctrl.products">
     *          <mdt-cell>{{product.name}}</mdt-cell>
     *          <mdt-cell>{{product.price}}</mdt-cell>
     *      </mdt-row>
     *  </mdt-table>
     * </pre>
     */
    function mdtColumnDirective(){
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: {
                alignRule: '@',
                sortBy: '=',
                columnDefinition: '@'
            },
            require: ['^mdtTable'],
            link: function ($scope, element, attrs, ctrl, transclude) {
                var mdtTableCtrl = ctrl[0];

                transclude(function (clone) {
                    mdtTableCtrl.addHeaderCell({
                        alignRule: $scope.alignRule,
                        sortBy: $scope.sortBy,
                        columnDefinition: $scope.columnDefinition,
                        columnName: clone.html()
                    });
                });
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtColumn', mdtColumnDirective);
}());
(function(){
    'use strict';

    function mdtGeneratedHeaderCellContentDirective(){
        return {
            restrict: 'E',
            templateUrl: '/main/templates/mdtGeneratedHeaderCellContent.html',
            replace: true,
            scope: false,
            link: function(){

            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtGeneratedHeaderCellContent', mdtGeneratedHeaderCellContentDirective);
}());
(function(){
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtHeaderRow
     * @restrict E
     * @requires mdtTable
     *
     * @description
     * Representing a header row which should be placed inside `mdt-table` element directive.
     * The main responsibility of this directive is to execute all the transcluded `mdt-column` element directives.
     *
     */
    function mdtHeaderRowDirective(){
        return {
            restrict: 'E',
            replace: true,
            transclude: true,
            require: '^mdtTable',
            scope: true,
            link: function($scope, element, attrs, mdtCtrl, transclude){
                appendColumns();

                function appendColumns(){
                    transclude(function (clone) {
                        element.append(clone);
                    });
                }
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtHeaderRow', mdtHeaderRowDirective);
}());
(function(){
    'use strict';

    function mdtAddAlignClass(ColumnAlignmentHelper){
        return {
            restrict: 'A',
            scope: {
                mdtAddAlignClass: '='
            },
            link: function($scope, element){
                var classToAdd = ColumnAlignmentHelper.getColumnAlignClass($scope.mdtAddAlignClass);

                element.addClass(classToAdd);
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtAddAlignClass', mdtAddAlignClass);
}());
(function () {
    'use strict';

    function mdtAddHtmlContentToCellDirective() {
        return {
            restrict: 'A',
            scope: {
                mdtAddHtmlContentToCell: '='
            },
            link: function ($scope, element, attr) {
                $scope.$watch('mdtAddHtmlContentToCell', function () {
                    element.empty();
                    element.append($scope.mdtAddHtmlContentToCell);

                });
                //$scope.$watch('htmlContent', function () {
                //    element.empty();
                //    element.append($scope.$eval(attr.mdtAddHtmlContentToCell));
                //});
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtAddHtmlContentToCell', mdtAddHtmlContentToCellDirective);
}());
(function(){
    'use strict';

    function mdtAnimateSortIconHandlerDirective(){
        return {
            restrict: 'A',
            scope: false,
            link: function($scope, element){
                if($scope.animateSortIcon){
                    element.addClass('animate-sort-icon');
                }
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtAnimateSortIconHandler', mdtAnimateSortIconHandlerDirective);
}());
(function(){
    'use strict';

    function mdtSelectAllRowsHandlerDirective(){
        return {
            restrict: 'A',
            scope: false,
            link: function($scope){
                $scope.selectAllRows = false;

                $scope.$watch('selectAllRows', function(val){
                    $scope.tableDataStorageService.setAllRowsSelected(val, $scope.isPaginationEnabled());
                });
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtSelectAllRowsHandler', mdtSelectAllRowsHandlerDirective);
}());
(function(){
    'use strict';

    function mdtSortHandlerDirective(){
        return {
            restrict: 'A',
            scope: false,
            link: function($scope, element){
                var columnIndex = $scope.$index;
                $scope.isSorted = isSorted;
                $scope.direction = 1;



                function sortHandler(){
                    if($scope.sortableColumns){
                        $scope.$apply(function(){
                            $scope.direction = $scope.tableDataStorageService.sortByColumn(columnIndex, $scope.headerRowData.sortBy);
                        });
                    }
                }

                element.on('click', sortHandler);

                function isSorted(){
                    return $scope.tableDataStorageService.sortByColumnLastIndex === columnIndex;
                }

                $scope.$on('$destroy', function(){
                    element.off('click', sortHandler);
                });
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtSortHandler', mdtSortHandlerDirective);
}());
(function(){
    'use strict';

    function mdtCardFooterDirective($timeout){
        return {
            restrict: 'E',
            templateUrl: '/main/templates/mdtCardFooter.html',
            transclude: true,
            replace: true,
            scope: true,
            require: ['^mdtTable'],
            link: function($scope){
                $scope.rowsPerPage = $scope.mdtPaginationHelper.rowsPerPage;

                $scope.$watch('rowsPerPage', function(newVal, oldVal){
                    $scope.mdtPaginationHelper.setRowsPerPage(newVal);
                });
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtCardFooter', mdtCardFooterDirective);
}());
(function(){
    'use strict';

    function mdtCardHeaderDirective(){
        return {
            restrict: 'E',
            templateUrl: '/main/templates/mdtCardHeader.html',
            transclude: true,
            replace: true,
            scope: true,
            require: ['^mdtTable'],
            link: function($scope){
                $scope.isTableCardEnabled = false;

                if($scope.tableCard && $scope.tableCard.visible !== false){
                    $scope.isTableCardEnabled = true;
                }
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtCardHeader', mdtCardHeaderDirective);
}());
angular.module("mdtTemplates", []).run(function($templateCache) {$templateCache.put("/main/templates/mdtAlternateHeaders.html","<div class=\"mdt-header-alternate\" layout=\"row\" layout-align=\"start center\">\n    <span class=\"alternate-text\" flex>{{tableDataStorageService.getNumberOfSelectedRows()}} item selected</span>\n    <md-button class=\"md-icon-button md-primary\" ng-click=\"deleteSelectedRows()\" aria-label=\"Delete selected rows\">\n        <ng-md-icon icon=\"delete\" size=\"24\"></ng-md-icon>\n    </md-button>\n\n    <md-button class=\"md-icon-button md-primary\" aria-label=\"More options\">\n        <ng-md-icon icon=\"more_vert\" size=\"24\"></ng-md-icon>\n    </md-button>\n</div>");
$templateCache.put("/main/templates/mdtCardFooter.html","<div class=\"mdt-footer\" layout=\"row\" ng-show=\"isPaginationEnabled()\">\n    <div class=\"mdt-pagination\"\n         layout=\"row\"\n         layout-align=\"end center\"\n         flex>\n\n        <span layout-margin>Rows per page:</span>\n        <md-input-container>\n            <md-select ng-model=\"rowsPerPage\" aria-label=\"rows per page\">\n                <md-option ng-value=\"pageSize\" ng-repeat=\"pageSize in mdtPaginationHelper.rowsPerPageValues\">{{pageSize}}</md-option>\n            </md-select>\n        </md-input-container>\n\n        <span layout-margin>\n            {{mdtPaginationHelper.getStartRowIndex()+1}}-{{mdtPaginationHelper.getEndRowIndex()+1}} of {{mdtPaginationHelper.getTotalRowsCount()}}\n        </span>\n\n        <md-button class=\"md-icon-button md-primary\" aria-label=\"Previous page\" ng-click=\"mdtPaginationHelper.previousPage()\">\n            <ng-md-icon icon=\"keyboard_arrow_left\" size=\"24\"></ng-md-icon>\n        </md-button>\n\n        <md-button class=\"md-icon-button md-primary\" aria-label=\"Next page\" ng-click=\"mdtPaginationHelper.nextPage()\">\n            <ng-md-icon icon=\"keyboard_arrow_right\" size=\"24\"></ng-md-icon>\n        </md-button>\n    </div>\n</div>");
$templateCache.put("/main/templates/mdtCardHeader.html","<div class=\"mdt-header\" layout=\"row\" layout-align=\"start center\" ng-show=\"isTableCardEnabled\">\n    <span flex>{{tableCard.title}}</span>\n<!--\n    <md-button class=\"md-icon-button md-primary\" aria-label=\"Filter\">\n        <ng-md-icon icon=\"filter_list\" size=\"24\"></ng-md-icon>\n    </md-button>\n    <md-button class=\"md-icon-button md-primary\" aria-label=\"More options\">\n        <ng-md-icon icon=\"more_vert\" size=\"24\"></ng-md-icon>\n    </md-button>\n-->\n</div>");
$templateCache.put("/main/templates/mdtGeneratedHeaderCellContent.html","<div>\n    <div layout=\"row\" ng-if=\"sortableColumns\" style=\"display: inline-block;\">\n        <md-tooltip ng-show=\"headerRowData.columnDefinition\">{{headerRowData.columnDefinition}}</md-tooltip>\n\n        <span ng-show=\"headerRowData.alignRule == \'right\'\">\n            <span class=\"hoverSortIcons\" ng-if=\"!isSorted()\">\n                <ng-md-icon icon=\"arrow_forward\" size=\"16\"></ng-md-icon>\n            </span>\n\n            <span class=\"sortedColumn\" ng-if=\"isSorted()\" ng-class=\"direction == -1 ? \'ascending\' : \'descending\'\">\n                <ng-md-icon icon=\"arrow_forward\" size=\"16\"></ng-md-icon>\n            </span>\n        </span>\n\n        <span>\n            {{headerRowData.columnName}}\n        </span>\n\n        <span ng-show=\"headerRowData.alignRule == \'left\'\">\n            <span class=\"hoverSortIcons\" ng-if=\"!isSorted()\">\n                <ng-md-icon icon=\"arrow_forward\" size=\"16\"></ng-md-icon>\n            </span>\n\n            <span class=\"sortedColumn\" ng-if=\"isSorted()\" ng-class=\"direction == -1 ? \'ascending\' : \'descending\'\">\n                <ng-md-icon icon=\"arrow_forward\" size=\"16\"></ng-md-icon>\n            </span>\n        </span>\n    </div>\n    <div ng-if=\"!sortableColumns\">\n        <md-tooltip ng-show=\"headerRowData.columnDefinition\">{{headerRowData.columnDefinition}}</md-tooltip>\n\n        <span>\n            {{headerRowData.columnName}}\n        </span>\n    </div>\n</div>");
$templateCache.put("/main/templates/mdtTable.html","<md-content flex class=\"mdtTable md-whiteframe-z1\" layout=\"column\" ng-cloak>\n\n    <div layout=\"row\" layout-align=\"center\" style=\"display:block;\">\n        <table cellpadding=\"0\" cellspacing=\"0\" width=\"100%\">\n            <thead id=\"visible-header\">\n            <tr class=\"theadTrRow\" mdt-animate-sort-icon-handler>\n                <th class=\"checkboxCell\"\n                    style=\" text-align:left;\"\n                    ng-if=\"selectableRows\"\n                    mdt-select-all-rows-handler>\n                    <md-checkbox aria-label=\"select all\" ng-model=\"selectAllRows\"></md-checkbox>\n                </th>\n                <th\n                        style=\"position:relative\"\n                        class=\"column\"\n                        ng-class=\"\'columnSize\'+$index\"\n                        ng-repeat=\"headerRowData in tableDataStorageService.header track by $index\"\n                        mdt-add-align-class=\"headerRowData.alignRule\"\n                        ng-style=\"headerRowData.style\"\n                        mdt-sort-handler\n                        md-ink-ripple=\"{{rippleEffect}}\">\n                    <div class=\"column-container\">\n                        <div class=\"column-header-body\">\n                            <mdt-generated-header-cell-content></mdt-generated-header-cell-content>\n                        </div>\n                    </div>\n                </th>\n            </tr>\n            </thead>\n            <tbody id=\"hiddenBody\" style=\"visibility: hidden;\">\n            <tr class=\"theadTrRow\" mdt-animate-sort-icon-handler>\n\n                <td\n                        style=\"position:relative\"\n                        class=\"column\"\n                        ng-class=\"\'columnSize\'+$index\"\n                        ng-repeat=\"cellData in tableDataStorageService.maxRow.data track by $index\"\n                        mdt-add-align-class=\"tableDataStorageService.header[$index].alignRule\"\n                        ng-switch=\"tableDataStorageService.header[$index].type\">\n                    <div class=\"column-container\">\n                        <div class=\"column-body\">\n                            <span ng-switch-when=\"html\" mdt-add-html-content-to-cell=\"tableDataStorageService.header[$index].content(tableDataStorageService.maxRow)\"></span>\n                            <span ng-switch-when=\"date\">{{cellData | date:\"MMM dd, yyyy\"}}</span>\n                            <span ng-switch-default ng-bind=\"cellData\"></span>\n                        </div>\n                    </div>\n                </td>\n            </tr>\n            </tbody>\n        </table>\n\n    </div>\n    <md-content flex layout=\"row\" layout-align=\"center\" ng-style=\"{\'margin-top\': hiddenBodyHeight()}\">\n        <table id=\"data-table\" cellpadding=\"0\" cellspacing=\"0\"\n               ng-style=\"{\'margin-top\': hiddenHeadHeight()}\">\n            <thead id=\"hiddenHead\" style=\"visibility: hidden;\">\n            <tr class=\"theadTrRow\"\n                mdt-animate-sort-icon-handler>\n\n                <th class=\"checkboxCell\"\n                    style=\"text-align:left;\"\n                    ng-if=\"selectableRows\"\n                    mdt-select-all-rows-handler>\n                    <md-checkbox aria-label=\"select all\" ng-model=\"selectAllRows\"></md-checkbox>\n                </th>\n\n                <th\n                        style=\"position: relative\"\n                        ng-repeat=\"headerRowData in tableDataStorageService.header track by $index\"\n                        mdt-add-align-class=\"headerRowData.alignRule\"\n                        ng-style=\"headerRowData.style\"\n                        class=\"column\"\n                        ng-class=\"\'columnSize\'+$index\"\n                        mdt-sort-handler\n                        md-ink-ripple=\"{{rippleEffect}}\">\n\n                    <div class=\"column-container\">\n                        <div class=\"column-header-body\">\n                            <mdt-generated-header-cell-content></mdt-generated-header-cell-content>\n                        </div>\n                    </div>\n                </th>\n            </tr>\n            </thead>\n            <tbody>\n            <tr ng-repeat=\"rowData in mdtPaginationHelper.getRows() track by $index\"\n                ng-class=\"{\'selectedRow\': rowData.optionList.selected}\"\n                ng-click=\"mdtPaginationHelper.selectRow(rowData)\"\n                ng-dblclick=\"mdtPaginationHelper.dblclick(rowData)\"\n                ng-contextmenu=\"\"\n                ng-show=\"(isPaginationEnabled() === false || rowData.optionList.visible === true) && rowData.optionList.deleted === false\">\n\n                <td class=\"checkboxCell\" ng-show=\"selectableRows\">\n                    <md-checkbox aria-label=\"select\" ng-model=\"rowData.optionList.selected\"></md-checkbox>\n                </td>\n                <!--ng-style=\"{\'width\':headerRowData.maxWidth}\"-->\n                <td class=\"column\"\n                    style=\"position:relative\"\n                    ng-class=\"\'columnSize\'+$index\"\n                    ng-repeat=\"headerRowData in tableDataStorageService.header track by $index\"\n\n                    ng-style=\"headerRowData.style\"\n                    mdt-add-align-class=\"tableDataStorageService.header[$index].alignRule\"\n                    ng-switch=\"tableDataStorageService.header[$index].type\">\n                    <div class=\"column-container\">\n                        <div class=\"column-body\">\n                            <span ng-switch-when=\"html\" mdt-add-html-content-to-cell=\"tableDataStorageService.header[$index].content(rowData)\"></span>\n                            <span ng-switch-when=\"date\">{{rowData.data[headerRowData.id] | date:\'MMM dd, yyyy\'}}</span>\n                            <span ng-switch-default>{{rowData.data[headerRowData.id]}}</span>\n                        </div>\n                    </div>\n\n                </td>\n            </tr>\n            <tr ng-show=\"mdtPaginationHelper.isLoading\">\n                <td colspan=\"999\">\n                    <md-progress-linear md-mode=\"indeterminate\"></md-progress-linear>\n                </td>\n            </tr>\n            <tr ng-show=\"mdtPaginationHelper.isLoadError\">\n                <td colspan=\"999\" ng-bind=\"mdtPaginationHelper.mdtRowPaginatorErrorMessage\">\n                </td>\n            </tr>\n            </tbody>\n        </table>\n\n\n    </md-content>\n\n\n    <!-- table card -->\n    <mdt-card-footer></mdt-card-footer>\n    <!-- table card end -->\n</md-content>");});