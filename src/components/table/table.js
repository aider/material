(function () {
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

    var mdtContextMenuFn = function ($compile, $parse, $timeout, Util) {
        return {
            restrict: 'A',
            scope: {
                menuList: '=',
                onPopup: '&',
                onMenuSelected: '&'
            },
            link: function (scope, elem, attrs) {
                var self = scope;

                scope.onDropdownMenuSelected = function (menuItem, menu) {
                    scope.onMenuSelected({menuItem: menuItem});
                };

                scope.$on('$destroy', function () {
                    self._menuListElem.remove();
                });

                scope.contextMenuState = {
                    left: 0,
                    top: 0,
                    visibility: 'hidden'
                };

                var init = function (elem) {
                    var menuListElem = angular.element('<mtd-dropdown></mtd-dropdown>'),
                        bodyElem = angular.element(document.body);

                    menuListElem.attr({
                        'class': 'context-menu',
                        'menu-list': 'menuList',
                        'on-menu-selected': 'onDropdownMenuSelected(menuItem)',
                        'ng-style': 'contextMenuState'
                    });
                    $compile(menuListElem)(scope);
                    bodyElem.append(menuListElem);


                    bodyElem.on('click', function (event) {
                        scope.contextMenuState.display = 'none';
                        scope.contextMenuState.isVisible = false;

                        scope.$digest();
                    });

                    var isIOs = /iPhone|iPod|iPad/i.test(navigator.userAgent);

                    if (isIOs) {
                        elem.bind('touchstart', function (evt) {
                            scope.touchend = false;
                            scope.longPress = false;
                            var self = this;
                            var event = evt;
                            $timeout(function () {
                                if (!scope.touchend) {
                                    scope.longPress = true;
                                }
                            }, 600);
                        });
                        elem.bind('touchend', function (event) {
                            scope.touchend = true;
                            if (scope.longPress) {
                                scope.menuVisible = true;
                                var left, top, offset;
                                if (scope.onPopup()) {
                                    left = event.originalEvent.pageX;
                                    top = event.originalEvent.pageY;
                                    offset = Util.offset(this);

                                    if (left + menuListElem.width() > offset.left + this.clientWidth) {
                                        left -= (left + menuListElem.width()) - (offset.left + this.clientWidth);
                                    }

                                    if (top + menuListElem.height() + $('md-list-item', this).height() > offset.top + this.clientHeight) {
                                        top -= menuListElem.height();
                                        // top -= (top + menuListElem[0].clientHeight) - (offset.top + this.clientHeight);
                                    }

                                    scope.contextMenuState.left = (left) + 'px';
                                    scope.contextMenuState.top = top + 'px';
                                    scope.contextMenuState.visibility = 'visible';
                                    scope.contextMenuState.display = 'block';
                                    scope.contextMenuState.isVisible = true;
                                }
                                scope.longPress = false;
                                scope.$digest();
                                event.preventDefault();

                            }
                        });
                    }

                    elem.on('contextmenu', function (event) {
                        var left, top, offset;

                        if (scope.onPopup()) {
                            left = event.clientX;
                            top = event.clientY;
                            offset = Util.offset(this);
                            if (left + menuListElem.width() > offset.left + this.clientWidth) {
                                left -= (left + menuListElem.width()) - (offset.left + this.clientWidth);
                            }
                            if (top + menuListElem.height() + $('md-list-item', this).height() > offset.top + this.clientHeight) {
                                top -= menuListElem.height();
                                // top -= (top + menuListElem[0].clientHeight) - (offset.top + this.clientHeight);
                                // top = top - menuListElem[0].clientHeight + $('md-list-item', this).height()  ;
                            }

                            scope.contextMenuState.left = left + 'px';
                            scope.contextMenuState.top = top + 'px';
                            scope.contextMenuState.visibility = 'visible';
                            scope.contextMenuState.display = 'block';
                            scope.contextMenuState.isVisible = true;
                        }

                        scope.$digest();
                        event.preventDefault();
                    });

                    self._elem = elem;
                    self._menuListElem = menuListElem;
                };

                init(elem);
            }

        };
    };
    angular
        .module('material.components.table')
        .directive('mtdContextMenu', ['$compile', '$parse', '$timeout', 'Util', mdtContextMenuFn]);

})();

(function () {
    'use strict';

    function onLongPress() {
        return {
            restrict: 'A',
            link: function ($scope, $elm, $attrs) {
                $elm.bind('touchstart', function (evt) {
                    // Locally scoped variable that will keep track of the long press
                    $scope.$apply(function () {
                        $scope.$eval($attrs.onLongPress)
                    });
                });

                // $elm.bind('touchend', function (evt) {
                //     // Prevent the onLongPress event from firing
                //     console.log('touchend');
                //     $scope.longPress = false;
                //     // If there is an on-touch-end function attached to this element, apply it
                //     if ($attrs.onTouchEnd) {
                //         $scope.$apply(function () {
                //             $scope.$eval($attrs.onTouchEnd)
                //         });
                //     }
                // });
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('onLongPress', onLongPress);
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
    function mdtTableDirective(TableDataStorageFactory, mdtPaginationHelperFactory, mdtAjaxPaginationHelperFactory, $timeout) {
        return {
            restrict: 'E',
            templateUrl: '/main/templates/mdtTable.html',
            transclude: true,
            replace: true,
            scope: {
                tableCard: '=',
                mdtMultiSelect: '@',
                //@deprecated
                selectableRows: '=',
                //@deprecated
                sortableColumns: '=',

                alternateHeaders: '=',
                mdtSelectable: '@',
                mdtSortable: '@',
                deleteRowCallback: '&',
                animateSortIcon: '=',
                rippleEffect: '=',
                paginatedRows: '=',
                mdtModel: '=',
                mdtSelectFn: '&',
                mdtTouchFn: '&',
                mdtDblclickFn: '&',
                mdtContextMenuFn: '&',
                mdtRow: '=',
                mtHideHeader: '=',
                mdtRowPaginator: '&?',
                mdtRowPaginatorErrorMessage: "@",
                mdtEmptyTitle: "=",

                menuList: "=",
                mdtMenuSelected: "&onMenuSelected",
                onPopup: "&"
            },
            controller: ['$scope', function ($scope) {
                $scope.selectable = $scope.mdtSelectable !== 'false';

                var vm = this;
                vm.addHeaderCell = addHeaderCell;
                $scope.remove = function (id) {
                    // console.log($scope.tableDataStorageService.storage);
                };

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

                    $scope.tableDataCnt = 0;
                    var unbindWatchMdtModel = $scope.$watch('mdtModel', function (data) {
                        var unbindCollection = $scope.$watchCollection('mdtModel.data', function (data) {
                            if (data) {
                                $timeout(function () {
                                    $scope.tableIsReady = true;
                                }, 500);
                            }
                            if (data && angular.isArray(data)) {
                                $scope.tableDataStorageService.initModel($scope.mdtModel, $scope.mdtSelectFn, $scope.mdtTouchFn, $scope.mdtDblclickFn, $scope.mdtContextMenuFn, $scope.onPopup, $scope.mdtMultiSelect);

                                var rowsLength = $scope.mdtPaginationHelper.getRows().length;
                                if (rowsLength) {
                                    $scope.watiForHeight(rowsLength, unbindCollection);
                                }
                            }
                        });

                        unbindWatchMdtModel();
                    });
                }


                function addHeaderCell(ops) {
                    $scope.tableDataStorageService.addHeaderCellData(ops);
                }


            }],
            link: function ($scope, element, attrs, ctrl, transclude) {
                $scope.sortable = $scope.mdtSortable !== 'false';

                $scope.gridId = $scope.$id;
                injectContentIntoTemplate();
                $scope.isSelectable = angular.isDefined(attrs.mdtSelectFn);

                $scope.isAnyRowSelected = _.bind($scope.tableDataStorageService.isAnyRowSelected, $scope.tableDataStorageService);
                $scope.isPaginationEnabled = isPaginationEnabled;

                $scope.remove = function (id) {
                    // console.log($scope.tableDataStorageService.storage);
                };
                $scope.onMenuSelected = function (menuItem) {
                    $scope.mdtMenuSelected({menuItem: menuItem});
                };

                // $scope.$on('mdt-table.select-all', function (event, selected) {
                //     $scope.tableDataStorageService.setAllRowsSelected(selected);
                // });

                function getScrollbarWidth() {
                    var outer = document.createElement("div");
                    outer.style.visibility = "hidden";
                    outer.style.width = "100px";
                    outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

                    document.body.appendChild(outer);

                    var widthNoScroll = outer.offsetWidth;
                    // force scrollbars
                    outer.style.overflow = "scroll";

                    // add innerdiv
                    var inner = document.createElement("div");
                    inner.style.width = "100%";
                    outer.appendChild(inner);

                    var widthWithScroll = inner.offsetWidth;

                    // remove divs
                    outer.parentNode.removeChild(outer);

                    return widthNoScroll - widthWithScroll;
                }


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
                    return -$('#hiddenHead', element).height() || 0;
                };


                $scope.hiddenBodyHeight = function () {
                    return -$('#hiddenBody', element).height();
                };

                $scope.watiForHeight = function (rowsLength, unbindCollection) {
                    $timeout(function () {
                        $scope.scrollWidth = getScrollbarWidth() || 1;
                        var baseContainer = $('#grid_' + $scope.gridId);
                        if (!baseContainer.length) {
                            unbindCollection();
                            return;
                        }
                        var $dc = $('.data-container', baseContainer);
                        if (!$dc.is(':visible')) {
                            $scope.watiForHeight(rowsLength, unbindCollection);
                            return
                        }
                        $scope.isScrollVisible = rowsLength * 48 > $dc.height();
                    });

                };

                // $scope.watiForHeight();

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

    function mtdDropdown() {
        return {
            restrict: 'EA',
            scope: {
                menuList: '=',
                callback: '&onMenuSelected'
            },
            templateUrl: '/main/templates/mdtDropdown.html',
            link: function (scope, elem, attrs, ctrl) {
                scope.onMenuSelected = function (menuItem) {
                    scope.callback({menuItem: menuItem});
                };
            }
        };
    }


    // function mdtContextMenu($parse) {
    //     return {
    //         restrict: 'A',
    //         scope: true,
    //         link: function (scope, element, attrs) {
    //             var menuHandler = $parse(attrs.mdtContextMenu);
    //             element.on('contextmenu', function (event) {
    //                 scope.$apply(function() {
    //                     menuHandler(scope, {$event: (event)});
    //                 });
    //                 return false;
    //
    //
    //             });
    //         }
    //     };
    // }
    function MtdRightClick($parse, $rootScope) {
        return {
            compile: function ($element, attr) {
                var fn = $parse(attr.mtdRightClick, /* interceptorFn */ null, /* expensiveChecks */ true);
                return function EventHandler(scope, element) {
                    element.on('contextmenu', function (event) {
                        var callback = function () {
                            fn(scope, {$event: event});
                        };
                        if ($rootScope.$$phase) {
                            scope.$evalAsync(callback);
                        } else {
                            scope.$apply(callback);
                        }
                    });
                };
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtTable', ['TableDataStorageFactory', 'mdtPaginationHelperFactory', 'mdtAjaxPaginationHelperFactory', '$timeout', mdtTableDirective])
        .directive('mtdRightClick', ['$parse', '$rootScope', MtdRightClick])
        .directive('mtdDropdown', mtdDropdown)
        .filter('ifEmpty', function () {
            return function (input, defaultValue) {
                if (angular.isUndefined(input) || input === null || input === '') {
                    return defaultValue;
                }

                return input;
            }
        })
        .filter('dateFilter', function ($filter) {
            return function (input, defaultValue) {
                if (angular.isUndefined(input) || input === null || input === '') {
                    return defaultValue;
                }
                var inputDate = new Date(input);
                var dateFilter = $filter('date');
                var dateFormated = dateFilter(inputDate, 'MMM dd, yyyy');
                var currentFormated = dateFilter(Date.now(), 'MMM dd, yyyy');

                if (currentFormated === dateFormated) {
                    dateFormated = dateFilter(inputDate, 'h:mm a');
                }
                return dateFormated;
            }
        });
}());
'use strict';

(function () {

    function mdtTableRow(superCache, $compile, $sce, mdtPaginationHelperFactory) {
        return {
            restrict: 'A',
            scope: {
                gridId: '=',
                props: '=',
                model: '=',
                selectable: '=',
                onClick: '&'
            },
            link: function (scope, element, attrs) {

                scope.trustAsHtml = function (string) {
                    return $sce.trustAsHtml(string);
                };
                var initColumns = function () {
                    var templateCacheKey = 'row_template' + scope.gridId;
                    var htmlTemplate = superCache.get(templateCacheKey);
                    if (!htmlTemplate) {
                        var rowTemplate = [];

                        var sortedProps = scope.props.filter(function (item) {
                            return item.enabled;
                        });
                        var isOnClickExists = scope.props.some(function (item) {
                            return !!item.onClick;
                        });
                        // superCache.put('sortedProps', sortedProps);

                        if (!isOnClickExists && scope.selectable) {
                            // rowTemplate.push('<button class="md-no-style md-button md-ink-ripple" type="button" ng-click="onTouch(model)">');
                            rowTemplate.push('<div class="md-button md-no-style"><button class="md-no-style md-button" type="button" ng-click="onClick(model)"></button><div class="md-list-item-inner">');
                        }

                        sortedProps.forEach(function (prop, index) {
                            if (prop.enabled) {
                                var style = '';
                                Object.keys(prop.style).forEach(function (kstyle) {
                                    // if(kstyle)
                                    var pValue = prop.style[kstyle];
                                    if (!isNaN(+pValue)) {
                                        pValue += 'px'
                                    }
                                    style += kstyle + ':' + pValue + ';';
                                });


                                // (prop.onClick ? ' ng-click="props[\'' + index + '\'].onClick(model)"' : '')
                                // rowTemplate.push('<div class="td ' + prop.class +'" '+  + style = "' + style + '" > ');
                                rowTemplate.push('<div class="td ' + prop.class + '" ' + (prop.onClick ? ' ng-click="props[\'' + index + '\'].onClick(model)"' : '') + ' style="' + style + '" > ');
                                rowTemplate.push('<div class="first-column-section" '+(prop.type==='html' ? 'style="display: inline-block;"':'')+'>');

                                if (prop.type === 'html') {
                                    rowTemplate.push('<div ng-bind-html="trustAsHtml(props[\'' + index + '\'].content(model))"></div>');
                                } else if (prop.type === 'currency') {
                                    rowTemplate.push('<span>{{(props[\'' + index + '\'].content(model) || model.data[\'' + prop.id + '\']) | currency:\'$\' | ifEmpty:\'&#8212\'}}</span>');
                                } else if (prop.type === 'number') {
                                    rowTemplate.push('<span>{{(props[\'' + index + '\'].content(model) || model.data[\'' + prop.id + '\']) | number:0 | ifEmpty:\'&#8212\'}}</span>');
                                } else if (prop.type === 'date') {
                                    if (prop.format) {
                                        rowTemplate.push('<span>{{(props[\'' + index + '\'].content(model) || model.data[\'' + prop.id + '\']) | date:\'' + prop.format + '\' | ifEmpty:\'&#8212\'}}</span>');
                                    } else {
                                        rowTemplate.push('<span>{{(props[\'' + index + '\'].content(model) || model.data[\'' + prop.id + '\']) | dateFilter:\'&#8212\'}}</span>');
                                    }
                                } else if (prop.type === 'datetime') {
                                    rowTemplate.push('<span>{{(props[\'' + index + '\'].content(model) || model.data[\'' + prop.id + '\']) | date:\'M/d/yyyy h:mm a\' | ifEmpty:\'&#8212\'}}</span>');
                                } else if (angular.isFunction(prop.content)) {
                                    rowTemplate.push('<span>{{props[\'' + index + '\'].content(model) | ifEmpty:\'&#8212\'}}</span>');
                                } else {
                                    rowTemplate.push('<span>{{model.data[\'' + prop.id + '\'] | ifEmpty:\'&#8212\'}}</span>');
                                }
                                rowTemplate.push('</div>');

                                if (prop.secondColumn) {
                                    rowTemplate.push('<div class="second-column-section ' + prop.secondColumn.class + '">');
                                    if (prop.type === 'html') {
                                        rowTemplate.push('<span ng-bind-html="trustAsHtml(props[\'' + index + '\'].secondColumn.content(model))"></span>');
                                    } else if (prop.type === 'date') {
                                        rowTemplate.push('<span>{{(props[\'' + index + '\'].secondColumn.content(model) | dateFilter:\'&#8212\'}}</span>');
                                    } else {
                                        rowTemplate.push('<span>{{props[\'' + index + '\'].secondColumn.content(model) | ifEmpty:\'&#8212\'}}</span>');
                                    }
                                    rowTemplate.push('</div>');
                                }
                                rowTemplate.push('</div>');
                            }
                        });
                        if (!isOnClickExists) {
                            rowTemplate.push('</div>');
                        }

                        htmlTemplate = rowTemplate.join('');
                        superCache.put(templateCacheKey, htmlTemplate);
                    }
                    element.html(htmlTemplate);
                    $compile(element.contents())(scope);
                };

                // var unbind = scope.$watch('model', function (newData) {
                //     if (newData) {
                //         initColumns();
                //         unbind();
                //     }
                // });
                initColumns();
            }
        };
    }

    angular.module('material.components.table').directive('mdtTableRow', ['superCache', '$compile', '$sce', 'mdtPaginationHelperFactory', mdtTableRow]);
})();

(function () {
    'use strict';

    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '');
        };
    }

    function TableDataStorageFactory($log) {

        function TableDataStorageService() {
            this.srcModel = {};
            this.storage = [];
            this.header = [];
            this.tableWidth = 0;
            this.maxRow = {data: {}};
            this.maxWidth = {};
            this.avgWidth = {};

            this.sortByColumnLastIndex = null;
            this.orderByAscending = true;
        }

        TableDataStorageService.prototype.initModel = function (mdtModel, selectCbFn, touchCbFn, dblClickCbFn, contextMenuFn, onPopup, mdtMultiSelect) {
            this.storage = [];
            this.maxRow = {data: {}};
            this.maxWidth = {};
            this.multiSelect = mdtMultiSelect === 'true' ;

            this.selectCbFn = selectCbFn;
            this.dblClickCbFn = dblClickCbFn;
            this.touchCbFn = touchCbFn;
            this.contextMenuFn = contextMenuFn;
            this.onPopup = onPopup;
            var _header = this.header = mdtModel.headers;
            // _header.push({id: 'checkbox', columnName: '', type: 'checkbox'});
            var _storage = this.storage;
            var _maxRow = this.maxRow.data;
            var _maxWidth = this.maxWidth;
            var _avgWidth = this.avgWidth;
            var _avgNonEmpty = {};
            var _headerWidth = {};

            var canvas = document.createElement("canvas");
            var context = canvas.getContext("2d");
            context.font = '500 12px Roboto';
            var orderIndex = 0;
            _header.forEach(function (header, index) {
                header.sortable = angular.isDefined(header.sortable) ? !!header.sortable : true;
                header.class = header.class || '';
                header.class += ' flex-order-' + orderIndex;
                orderIndex++;

                // if (header.secondColumn) {
                //     header.class += ' first-column-section';
                //     header.secondColumn.class += ' flex-order-' + orderIndex;
                // } else {
                //     // header.class
                // }

                var _value = header.columnName;
                var metrics = context.measureText(_value);
                var _width = metrics.width + 45;
                _headerWidth[header.id] = _width;
                if (!_maxRow[header.id]) {
                    _maxRow[header.id] = _value;
                    _maxWidth[header.id] = _width;
                } else if (_maxWidth[header.id] < _width) {
                    _maxRow[header.id] = _value;
                    _maxWidth[header.id] = _width;
                }

            });
            context.font = '400 13px Roboto';

            mdtModel.data.forEach(function (item) {
                _header.forEach(function (header, index) {
                    var _value;
                    if (header && header.type === 'html') {
                        _value = jQuery(header.content({data: item})).text();
                    } else if (angular.isFunction(header.content)) {
                        _value = header.content({data: item});
                    } else {
                        _value = angular.isArray(item[header.id]) ? item[header.id].join(' ') : item[header.id];
                    }

                    _value = _value ? _value.toString().trim() : _value;
                    var isEmpty = angular.isUndefined(_value) || _value == null;
                    var _width = 0;
                    if (!isEmpty) {
                        var metrics = context.measureText(_value);
                        _width = metrics.width + 45;
                    }
                    if (!_avgWidth[header.id]) {
                        _avgWidth[header.id] = 0;
                    }
                    if (!_avgNonEmpty[header.id]) {
                        _avgNonEmpty[header.id] = 0;
                    }


                    _avgNonEmpty[header.id] += isEmpty ? 0 : 1;
                    _avgWidth[header.id] += _width;
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
                    rowId: id,
                    optionList: {
                        selected: false,
                        deleted: false,
                        visible: true
                    },
                    data: item
                });
            });
            _header.forEach(function (header) {
                _maxWidth[header.id] = 3 * _maxWidth[header.id];

            });
            var _tableWidth = 0;
            _header.forEach(function (header, index) {
                _avgWidth[header.id] = _avgWidth[header.id] / (_avgNonEmpty[header.id] > 0 ? _avgNonEmpty[header.id] : 1);
                if (_avgWidth[header.id] < _headerWidth[header.id]) {
                    _avgWidth[header.id] = _headerWidth[header.id];
                }

                header.style = header.style || {};
                if (!header.style['width'] || (header.type !== 'html' && header.style['width'] < _maxWidth[header.id])) {
                // if (!header.style['width'] || header.style['width'] < _maxWidth[header.id]) {
                    header.style['width'] = Math.round(_maxWidth[header.id]);
                }
                var minWidthStyle = header.style['min-width'];
                if (!minWidthStyle && mdtModel.data.length) {
                    minWidthStyle = header.style['min-width'] = Math.round(_avgWidth[header.id]);
                }
                var minWidth = 0;

                if (angular.isDefined(minWidthStyle)) {
                    if (angular.isNumber(minWidthStyle)) {
                        minWidth = minWidthStyle;
                    } else {
                        minWidth = +minWidthStyle.replace('px', '');
                    }
                }
                _tableWidth += minWidth + (index === 0 ? 16 + 6 : 6 + 6);
            });

            this.tableWidth = _tableWidth;
            this.tableWidthStyle = 'min-width:' + _tableWidth + 'px';

            if (this.sortByColumnLastIndex >= 0) {
                this.sortByColumnIndex(this.sortByColumnLastIndex, undefined, this.sortFunction);
                if (!this.orderByAscending) {
                    this.storage.reverse();
                }
            }
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
            for (var i = 0; i < this.storage.length; i++) {
                var rowData = this.storage[i];
                if (isPaginationEnabled) {
                    if (rowData.optionList.visible) {
                        rowData.optionList.selected = !!isSelected;
                    }
                } else {
                    rowData.optionList.selected = !!isSelected;
                }

            }
        };

        TableDataStorageService.prototype.reverseRows = function () {
            this.storage.reverse();
        };

        // TableDataStorageService.prototype.isSortable = function (columnIndex) {
        //     return this.header[index].sortable;
        // };

        TableDataStorageService.prototype.sortByColumn = function (columnIndex, iteratee, manual) {
            if (this.sortByColumnLastIndex === columnIndex && !manual) {
                this.reverseRows();

                this.orderByAscending = !this.orderByAscending;
            } else {
                this.sortByColumnIndex(columnIndex, iteratee);
                this.orderByAscending = true;
            }
            this.sortByColumnLastIndex = columnIndex;
            return this.orderByAscending ? -1 : 1;
        };

        TableDataStorageService.prototype.sortByColumnIndex = function (index, iteratee, _sortFunction) {
            if (!_sortFunction) {
                if (typeof iteratee === 'function') {
                    _sortFunction = function (rowData) {
                        return iteratee(rowData.data[index], rowData, index);
                    };
                } else {
                    var id = this.header[index] ? this.header[index].id : undefined;
                    _sortFunction = function (rowData) {

                        var datum = rowData.data[id || index];
                        if (angular.isArray(datum)) {
                            datum = datum.join(' ');
                        }
                        return !angular.isDefined(datum) || datum == null || /^\s*$/.test(datum) ? undefined : (angular.isNumber(datum) ? datum : datum.trim());
                    };
                }
                this.sortFunction = _sortFunction;
            } else {
                _sortFunction = this.sortFunction;
            }
            this.storage = _.sortBy(this.storage, _sortFunction);

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
        .factory('TableDataStorageFactory', ['$log', TableDataStorageFactory]);
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

            var startRowIndex = that.getStartRowIndex();
            var endRowIndex = that.getEndRowIndex();
            for (var index = 0; index < that.tableDataStorageService.storage.length; index++) {
                // var rowData = this.tableDataStorageService.storage[index];
                // that.tableDataStorageService.storage[index];
                that.tableDataStorageService.storage[index].optionList.visible = !!(index >= startRowIndex && index <= endRowIndex);

            }
            // _.each(this.tableDataStorageService.storage, function (rowData, index) {
            //     if (index >= that.getStartRowIndex() && index <= that.getEndRowIndex()) {
            //         rowData.optionList.visible = true;
            //     } else {
            //         rowData.optionList.visible = false;
            //     }
            // });
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
        mdtPaginationHelper.prototype.longClick = function (rowData) {
            this.selectRow(rowData);
            this.contextMenu({rowData: rowData});
        };

        mdtPaginationHelper.prototype.contextMenu = function (rowData, $event) {
            this.tableDataStorageService.contextMenuFn({rowData: rowData, $event: $event});
        };

        mdtPaginationHelper.prototype.selectRow = function (rowData) {
            rowData.optionList.selected = !rowData.optionList.selected;


            var dss = this.tableDataStorageService;
            if (!dss.multiSelect) {
                if (dss.selectedRow && rowData != dss.selectedRow) {
                    dss.selectedRow.optionList.selected = false;
                }
                dss.selectedRow = rowData;
            }
            dss.selectCbFn({rowData: rowData});

        };
        mdtPaginationHelper.prototype.onTouch = function (rowData) {
            var isMobile = /iPhone|iPod|iPad|Android/i.test(navigator.userAgent);

            if (isMobile) {
                rowData.optionList.selected = !rowData.optionList.selected;
                this.dblclick(rowData);
                /*
                 if (this.tableDataStorageService.selectedRow && rowData != this.tableDataStorageService.selectedRow) {
                 this.tableDataStorageService.selectedRow.optionList.selected = false;
                 }
                 this.tableDataStorageService.selectedRow = rowData;
                 this.tableDataStorageService.touchCbFn({rowData: rowData});*/
            } else {
                this.selectRow(rowData);
            }
        };

        mdtPaginationHelper.prototype.getRows = function () {
            // var sTime = Date.now();

            // this.calculateVisibleRows();
            // console.log('getRows['+(Date.now()-sTime)+']');
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
        .service('ColumnAlignmentHelper', ['ColumnOptionProvider', ColumnAlignmentHelper]);
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
        .directive('mdtCell', ['$parse', '$compile',mdtCellDirective]);
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
(function () {
    'use strict';

    function mdtGeneratedHeaderCellContentDirective($sce) {
        return {
            restrict: 'E',
            templateUrl: '/main/templates/mdtGeneratedHeaderCellContent.html',
            replace: true,
            scope: false,
            link: function (scope) {
                scope.trustHtml = function (html) {
                    return $sce.trustAsHtml(html);
                }
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtGeneratedHeaderCellContent', ['$sce', mdtGeneratedHeaderCellContentDirective]);
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
(function () {
    'use strict';

    function mdtSortHandlerDirective() {
        return {
            restrict: 'A',
            scope: false,
            link: function ($scope, element) {
                var columnIndex = $scope.$index;
                $scope.isSorted = isSorted;
                $scope.direction = 1;


                function sortHandler() {
                    if(angular.isFunction($scope.headerRowData.onColumnClick)) {
                        $scope.headerRowData.onColumnClick($scope.tableDataStorageService.storage);
                    }
                    if ($scope.sortableColumns && $scope.headerRowData.sortable) {
                        $scope.$apply(function () {
                            $scope.direction = $scope.tableDataStorageService.sortByColumn(columnIndex, $scope.headerRowData.sortBy);
                        });
                    }
                }

                element.on('click', sortHandler);

                function isSorted() {
                    return $scope.tableDataStorageService.sortByColumnLastIndex === columnIndex;
                }

                $scope.$on('$destroy', function () {
                    element.off('click', sortHandler);
                });
            }
        };
    }

    angular
        .module('material.components.table')
        .directive('mdtSortHandler', mdtSortHandlerDirective);
}());
(function () {
    angular
        .module('material.components.table')
        .factory('Util', UtilService);
    angular
        .module('material.components.table')
        .factory('superCache', superCache);

    function UtilService() {
        return {
            startsWith: function (src, prefix) {
                return src.length >= prefix.length && src.substring(0, prefix.length) === prefix;
            },
            offset: function (node) {
                var parentNode = node,
                    top = 0,
                    left = 0;

                while (typeof parentNode.offsetTop !== 'undefined') {
                    var _parentNode = parentNode.parentNode;

                    if (_parentNode && _parentNode.tagName && _parentNode.tagName.toLowerCase() == "section") {
                        break;
                    }
                    top += parentNode.offsetTop;
                    left += parentNode.offsetLeft;
                    parentNode = parentNode.parentNode;


                }

                return {
                    top: top,
                    left: left
                };
            }
        };
    }

    function superCache() {
        var cache = {};
        return {
            put: function (key, value) {
                cache[key] = value;
            },
            get: function (key) {
                return cache[key];
            }
        };
    }
})();

(function(){
    'use strict';

    function mdtCardFooterDirective(){
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
$templateCache.put("/main/templates/mdtDropdown.html","<md-whiteframe class=\"md-whiteframe-4dp md-whiteframe-z2\" layout=\"column\">\n  <md-button ng-if=\"menuItem.enabled\" class=\"mdt-dropdown-menu-item\" ng-repeat=\"menuItem in menuList\" ng-click=\"onMenuSelected(menuItem)\" layout=\"row\" aria-label=\"{{::menuItem.name}}\">\n    <md-icon md-font-icon=\"material-icons\">{{::menuItem.icon}}</md-icon> <span class=\"name\" ng-bind=\"::menuItem.name\" flex></span>\n  </md-button>\n</md-whiteframe>\n");
$templateCache.put("/main/templates/mdtGeneratedHeaderCellContent.html","<div ng-style=\"headerRowData.columnStyle\">\n    <!-- style=\"width: 100%;text-align: center;\"-->\n    <div style=\"display: inline-block;\" ng-if=\"headerRowData.columnType == \'html\'\" ng-bind-html=\"trustHtml(headerRowData.columnContent())\"></div>\n\n    <div ng-if=\"headerRowData.columnType != \'html\'\" layout=\"row\" ng-show=\"sortableColumns && headerRowData.sortable\" style=\"display: inline-block;\">\n        <md-tooltip ng-if=\"headerRowData.columnDefinition\">{{headerRowData.columnDefinition}}</md-tooltip>\n\n        <span ng-show=\"headerRowData.alignRule == \'right\' && headerRowData.sortable\">\n            <span class=\"hoverSortIcons\" ng-show=\"!isSorted()\">\n                <ng-md-icon icon=\"arrow_forward\" size=\"16\"></ng-md-icon>\n            </span>\n\n            <span class=\"sortedColumn\" ng-show=\"isSorted()\" ng-class=\"direction == -1 ? \'ascending\' : \'descending\'\">\n                <ng-md-icon icon=\"arrow_forward\" size=\"16\"></ng-md-icon>\n            </span>\n        </span>\n        <span>\n            {{headerRowData.columnName}}\n        </span>\n        <span ng-show=\"headerRowData.alignRule == \'left\' && headerRowData.sortable\">\n            <span class=\"hoverSortIcons\" ng-show=\"!isSorted()\">\n                <ng-md-icon icon=\"arrow_forward\" size=\"16\"></ng-md-icon>\n            </span>\n\n            <span class=\"sortedColumn\" ng-show=\"isSorted()\" ng-class=\"direction == -1 ? \'ascending\' : \'descending\'\">\n                <ng-md-icon icon=\"arrow_forward\" size=\"16\"></ng-md-icon>\n            </span>\n        </span>\n    </div>\n    <div ng-if=\"headerRowData.columnType != \'html\'\" ng-show=\"!sortableColumns\">\n        <md-tooltip ng-if=\"headerRowData.columnDefinition\">{{headerRowData.columnDefinition}}</md-tooltip>\n\n        <span>\n            {{headerRowData.columnName}}\n        </span>\n    </div>\n</div>");
$templateCache.put("/main/templates/mdtTable.html","<md-content id=\"grid_{{gridId}}\" flex class=\"mdtTable md-whiteframe-z1\" layout=\"column\" style=\"width:100%;box-shadow: none;overflow-x: hidden;{{tableDataStorageService.tableWidthStyle}}\" ng-cloak ng-class=\"{\'invisible\': (!tableIsReady)}\">\n    <div ng-hide=\"tableDataStorageService.storage.length\" flex layout=\"column\" layout-align=\"center center\" style=\"height: 100%\">\n        <span class=\"md-subhead\" ng-bind=\"mdtEmptyTitle\"></span>\n    </div>\n    <!--\n        mdt-sort-handler\n        md-ink-ripple=\"{{rippleEffect}}\"\n    -->\n\n    <div id=\"visible-header\" class=\"row-header\" style=\"display: block\" ng-show=\"tableDataStorageService.storage.length && !mtHideHeader && tableDataStorageService.tableWidth\">\n        <div ng-cloak layout=\"row\" flex>\n            <div ng-if=\"!sortable\"\n                 ng-style=\"headerRowData.style\"\n                 class=\"th\"\n                 mdt-add-align-class=\"headerRowData.alignRule\"\n                 ng-repeat=\"headerRowData in tableDataStorageService.header | filter: {enabled : true} track by $index\" ng-class=\"headerRowData.class\">\n                <mdt-generated-header-cell-content></mdt-generated-header-cell-content>\n            </div>\n\n            <div ng-if=\"sortable\"\n                 ng-style=\"headerRowData.style\"\n                 class=\"th\"\n                 mdt-sort-handler\n                 md-ink-ripple=\"{{rippleEffect}}\"\n                 mdt-add-align-class=\"headerRowData.alignRule\"\n                 ng-repeat=\"headerRowData in tableDataStorageService.header | filter: {enabled : true} track by $index\" ng-class=\"headerRowData.class\">\n                <mdt-generated-header-cell-content></mdt-generated-header-cell-content>\n            </div>\n            <div class=\"th flex-order-{{tableDataStorageService.header.length}}\" ng-if=\"isScrollVisible\" ng-style=\"{\'width\':scrollWidth,\'padding-right\':\'0\'}\"></div>\n        </div>\n    </div>\n    <div class=\"data-container\" flex layout=\"column\" ng-show=\"tableDataStorageService.storage.length && tableDataStorageService.tableWidth && isSelectable\">\n        <md-list flex mtd-context-menu\n                 ng-if=\"isSelectable\"\n                 style=\"position: relative\"\n                 menu-list=\"menuList\"\n                 on-menu-selected=\"onMenuSelected(menuItem)\"\n                 on-popup=\"onPopup()\">\n            <md-virtual-repeat-container ng-style=\"mtHideHeader && {\'top\':\'10px\'} || {\'top\':\'0px\'}\" style=\"bottom:0;left:0;right:0;width:100%;position: absolute\">\n                <md-list-item md-virtual-repeat=\"rowData in tableDataStorageService.storage\"\n\n                              aria-label=\"{{$index}}\"\n                              ng-class=\"{\'selectedRow\': rowData.optionList.selected}\"\n                              class=\"row-container\"\n                              on-long-press=\"mdtPaginationHelper.selectRow(rowData)\"\n                              ng-dblclick=\"mdtPaginationHelper.dblclick(rowData)\"\n                              mtd-right-click=\"mdtPaginationHelper.selectRow(rowData)\"\n                              mdt-table-row\n                              data-grid-id=\"gridId\"\n                              data-selectable=\"selectable\"\n                              data-on-click=\"mdtPaginationHelper.onTouch(rowData)\"\n                              data-props=\"tableDataStorageService.header\"\n                              data-model=\"rowData\">\n                </md-list-item>\n            </md-virtual-repeat-container>\n        </md-list>\n    </div>\n    <div class=\"data-container\" flex layout=\"column\" ng-show=\"tableDataStorageService.storage.length && tableDataStorageService.tableWidth && !isSelectable\">\n        <md-list flex style=\"position: relative\" ng-if=\"!isSelectable\">\n\n            <md-virtual-repeat-container ng-style=\"mtHideHeader && {\'top\':\'10px\'} || {\'top\':\'0px\'}\" style=\"bottom:0;left:0;right:0;width:100%;position: absolute\">\n                <md-list-item md-virtual-repeat=\"rowData in tableDataStorageService.storage\"\n\n                              aria-label=\"{{$index}}\"\n                              class=\"row-container\"\n                              on-long-press=\"mdtPaginationHelper.selectRow(rowData)\"\n                              ng-dblclick=\"mdtPaginationHelper.dblclick(rowData)\"\n                              mtd-right-click=\"mdtPaginationHelper.selectRow(rowData)\"\n                              mdt-table-row\n                              data-grid-id=\"gridId\"\n                              data-selectable=\"selectable\"\n                              data-on-click=\"mdtPaginationHelper.onTouch(rowData)\"\n                              data-props=\"tableDataStorageService.header\"\n                              data-model=\"rowData\">\n                </md-list-item>\n            </md-virtual-repeat-container>\n        </md-list>\n    </div>\n</md-content>\n");});