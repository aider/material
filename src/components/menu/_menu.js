/**
 * @ngdoc module
 * @name material.components.menu
 */

angular.module('material.components.menu', [
  'material.core',
  'material.components.backdrop'
])
.directive('mdMenu', MenuDirective)
.controller('mdMenuCtrl', MenuController);

/**
 * @ngdoc directive
 * @name mdMenu
 * @module material.components.menu
 * @restrict E
 * @description
 *
 * Menus are elements that open when clicked. They are useful for displaying
 * additional options within the context of an action.
 *
 * Every `md-menu` must specify exactly two child elements. The first element is what is
 * left in the DOM and is used to open the menu. This element is called the trigger element.
 * The trigger element's scope has access to `$mdOpenMenu($event)`
 * which it may call to open the menu. By passing $event as argument, the
 * corresponding event is stopped from propagating up the DOM-tree.
 *
 * The second element is the `md-menu-content` element which represents the
 * contents of the menu when it is open. Typically this will contain `md-menu-item`s,
 * but you can do custom content as well.
 *
 * <hljs lang="html">
 * <md-menu>
 *  <!-- Trigger element is a md-button with an icon -->
 *  <md-button ng-click="$mdOpenMenu($event)" class="md-icon-button" aria-label="Open sample menu">
 *    <md-icon md-svg-icon="call:phone"></md-icon>
 *  </md-button>
 *  <md-menu-content>
 *    <md-menu-item><md-button ng-click="doSomething()">Do Something</md-button></md-menu-item>
 *  </md-menu-content>
 * </md-menu>
 * </hljs>

 * ## Sizing Menus
 *
 * The width of the menu when it is open may be specified by specifying a `width`
 * attribute on the `md-menu-content` element.
 * See the [Material Design Spec](http://www.google.com/design/spec/components/menus.html#menus-specs)
 * for more information.
 *
 *
 * ## Aligning Menus
 *
 * When a menu opens, it is important that the content aligns with the trigger element.
 * Failure to align menus can result in jarring experiences for users as content
 * suddenly shifts. To help with this, `md-menu` provides serveral APIs to help
 * with alignment.
 *
 * ### Target Mode
 *
 * By default, `md-menu` will attempt to align the `md-menu-content` by aligning
 * designated child elements in both the trigger and the menu content.
 *
 * To specify the alignment element in the `trigger` you can use the `md-menu-origin`
 * attribute on a child element. If no `md-menu-origin` is specified, the `md-menu`
 * will be used as the origin element.
 *
 * Similarly, the `md-menu-content` may specify a `md-menu-align-target` for a
 * `md-menu-item` to specify the node that it should try and align with.
 *
 * In this example code, we specify an icon to be our origin element, and an
 * icon in our menu content to be our alignment target. This ensures that both
 * icons are aligned when the menu opens.
 *
 * <hljs lang="html">
 * <md-menu>
 *  <md-button ng-click="$mdOpenMenu($event)" class="md-icon-button" aria-label="Open some menu">
 *    <md-icon md-menu-origin md-svg-icon="call:phone"></md-icon>
 *  </md-button>
 *  <md-menu-content>
 *    <md-menu-item>
 *      <md-button ng-click="doSomething()" aria-label="Do something">
 *        <md-icon md-menu-align-target md-svg-icon="call:phone"></md-icon>
 *        Do Something
 *      </md-button>
 *    </md-menu-item>
 *  </md-menu-content>
 * </md-menu>
 * </hljs>
 *
 * Sometimes we want to specify alignment on the right side of an element, for example
 * if we have a menu on the right side a toolbar, we want to right align our menu content.
 *
 * We can specify the origin by using the `md-position-mode` attribute on both
 * the `x` and `y` axis. Right now only the `x-axis` has more than one option.
 * You may specify the default mode of `target target` or
 * `target-right target` to specify a right-oriented alignment target. See the
 * position section of the demos for more examples.
 *
 * ### Menu Offsets
 *
 * It is sometimes unavoidable to need to have a deeper level of control for
 * the positioning of a menu to ensure perfect alignment. `md-menu` provides
 * the `md-offset` attribute to allow pixel level specificty of adjusting the
 * exact positioning.
 *
 * This offset is provided in the format of `x y` or `n` where `n` will be used
 * in both the `x` and `y` axis.
 *
 * For example, to move a menu by `2px` from the top, we can use:
 * <hljs lang="html">
 * <md-menu md-offset="2 0">
 *   <!-- menu-content -->
 * </md-menu>
 * </hljs>
 *
 * @usage
 * <hljs lang="html">
 * <md-menu>
 *  <md-button ng-click="$mdOpenMenu($event)" class="md-icon-button">
 *    <md-icon md-svg-icon="call:phone"></md-icon>
 *  </md-button>
 *  <md-menu-content>
 *    <md-menu-item><md-button ng-click="doSomething()">Do Something</md-button></md-menu-item>
 *  </md-menu-content>
 * </md-menu>
 * </hljs>
 *
 * @param {string} md-position-mode The position mode in the form of
             `x`, `y`. Default value is `target`,`target`. Right now the `x` axis
             also suppports `target-right`.
 * @param {string} md-offset An offset to apply to the dropdown after positioning
             `x`, `y`. Default value is `0`,`0`.
 *
 */

function MenuDirective($mdMenu, $mdUtil, $timeout) {
  var INVALID_PREFIX = 'Invalid HTML for md-menu: ';
  return {
    restrict: 'E',
    require: ['mdMenu', '?^mdMenuBar'],
    controller: 'mdMenuCtrl', // empty function to be built by link
    scope: true,
    compile: compile
  };

  function compile(templateElement) {
    templateElement.addClass('md-menu');
    var triggerElement = templateElement.children()[0];
    if (!triggerElement.hasAttribute('ng-click')) {
      triggerElement = triggerElement.querySelector('[ng-click],[ng-mouseenter]') || triggerElement;
    }
    if (triggerElement && (
      triggerElement.nodeName == 'MD-BUTTON' ||
      triggerElement.nodeName == 'BUTTON'
    ) && !triggerElement.hasAttribute('type')) {
      triggerElement.setAttribute('type', 'button');
    }

    if (templateElement.children().length != 2) {
      throw Error(INVALID_PREFIX + 'Expected two children elements.');
    }

    // Default element for ARIA attributes has the ngClick or ngMouseenter expression
    triggerElement && triggerElement.setAttribute('aria-haspopup', 'true');

    var nestedMenus = templateElement[0].querySelectorAll('md-menu');
    var nestingDepth = parseInt(templateElement[0].getAttribute('md-nest-level'), 10) || 0;
    if (nestedMenus) {
      angular.forEach($mdUtil.nodesToArray(nestedMenus), function(menuEl) {
        if (!menuEl.hasAttribute('md-position-mode')) {
          menuEl.setAttribute('md-position-mode', 'cascade');
        }
        menuEl.classList.add('md-nested-menu');
        menuEl.setAttribute('md-nest-level', nestingDepth + 1);
        menuEl.setAttribute('role', 'menu');
      });
    }
    return link;
  }

  function link(scope, element, attrs, ctrls) {
    var mdMenuCtrl = ctrls[0];
    debugger;
    var isInMenuBar = ctrls[1] != undefined;
    // Move everything into a md-menu-container and pass it to the controller
    var menuContainer = angular.element(
      '<div class="md-open-menu-container md-whiteframe-z2"></div>'
    );
    var menuContents = element.children()[1];
    menuContainer.append(menuContents);
    if (isInMenuBar) {
      element.append(menuContainer);
      menuContainer[0].style.display = 'none';
    }
    mdMenuCtrl.init(menuContainer, { isInMenuBar: isInMenuBar });

    scope.$on('$destroy', function() {
      menuContainer.remove();
      mdMenuCtrl.close();
    });

  }
}

function MenuController($mdMenu, $attrs, $element, $scope, $mdUtil, $timeout) {

  var menuContainer;
  var self = this;
  var triggerElement;

  this.nestLevel = parseInt($attrs.mdNestLevel, 10) || 0;

  /**
   * Called by our linking fn to provide access to the menu-content
   * element removed during link
   */
  this.init = function init(setMenuContainer, opts) {
    opts = opts || {};
    menuContainer = setMenuContainer;
    // Default element for ARIA attributes has the ngClick or ngMouseenter expression
    triggerElement = $element[0].querySelector('[ng-click],[ng-mouseenter]');

    this.isInMenuBar = opts.isInMenuBar;
    this.nestedMenus = $mdUtil.nodesToArray(menuContainer[0].querySelectorAll('.md-nested-menu'));
    this.enableHoverListener();

    menuContainer.on('$mdInterimElementRemove', function() {
      self.isOpen = false;
    });
  };

  this.enableHoverListener = function() {
    $scope.$on('$mdMenuOpen', function(event, el) {
      if (menuContainer[0].contains(el[0])) {
        self.currentlyOpenMenu = el.controller('mdMenu');
        self.isAlreadyOpening = false;
        self.currentlyOpenMenu.registerContainerProxy(self.triggerContainerProxy.bind(self));
      }
    });
    $scope.$on('$mdMenuClose', function(event, el) {
      if (menuContainer[0].contains(el[0])) {
        self.currentlyOpenMenu = undefined;
      }
    });

    var menuItems = angular.element($mdUtil.nodesToArray(menuContainer[0].querySelectorAll('md-menu-item')));

    var openMenuTimeout;
    menuItems.on('mouseenter', function(event) {
      if (self.isAlreadyOpening) return;
      var nestedMenu = (
        event.target.querySelector('md-menu')
          || $mdUtil.getClosest(event.target, 'MD-MENU')
      );
      openMenuTimeout = $timeout(function() {
        if (nestedMenu) {
          nestedMenu = angular.element(nestedMenu).controller('mdMenu');
        }

        if (self.currentlyOpenMenu && self.currentlyOpenMenu != nestedMenu) {
          var closeTo = self.nestLevel + 1;
          self.currentlyOpenMenu.close(true, { closeTo: closeTo });
        } else if (nestedMenu && !nestedMenu.isOpen && nestedMenu.open) {
          self.isAlreadyOpening = true;
          nestedMenu.open();
        }
      }, nestedMenu ? 100 : 250);
      var focusableTarget = event.currentTarget.querySelector('[tabindex]');
      focusableTarget && focusableTarget.focus();
    });
    menuItems.on('mouseleave', function(event) {
      if (openMenuTimeout) {
        $timeout.cancel(openMenuTimeout);
        openMenuTimeout = undefined;
      }
    });
  };

  /**
   * Uses the $mdMenu interim element service to open the menu contents
   */
  this.open = function openMenu(ev) {
    ev && ev.stopPropagation();
    ev && ev.preventDefault();
    if (self.isOpen) return;
    self.isOpen = true;
    triggerElement = triggerElement || (ev ? ev.target : $element[0]);
    $scope.$emit('$mdMenuOpen', $element);
    $mdMenu.show({
      scope: $scope,
      mdMenuCtrl: self,
      nestLevel: self.nestLevel,
      element: menuContainer,
      target: triggerElement,
      preserveElement: self.isInMenuBar || self.nestedMenus.length > 0,
      parent: self.isInMenuBar ? $element : 'body'
    });
  }

  // Expose a open function to the child scope for html to use
  $scope.$mdOpenMenu = this.open;

  $scope.$watch(function() { return self.isOpen; }, function(isOpen) {
    if (isOpen) {
      triggerElement.setAttribute('aria-expanded', 'true');
      $element[0].classList.add('md-open');
      angular.forEach(self.nestedMenus, function(el) {
        el.classList.remove('md-open');
      });
    } else {
      triggerElement && triggerElement.setAttribute('aria-expanded', 'false');
      $element[0].classList.remove('md-open');
    }
    $scope.$mdMenuIsOpen = self.isOpen;
  });

  this.focusMenuContainer = function focusMenuContainer() {
    var focusTarget = menuContainer[0].querySelector('[md-menu-focus-target]');
    if (!focusTarget) focusTarget = menuContainer[0].querySelector('.md-button');
    focusTarget.focus();
  };

  this.registerContainerProxy = function registerContainerProxy(handler) {
    this.containerProxy = handler;
  };

  this.triggerContainerProxy = function triggerContainerProxy(ev) {
    this.containerProxy && this.containerProxy(ev);
  };

  // Use the $mdMenu interim element service to close the menu contents
  this.close = function closeMenu(skipFocus, closeOpts) {
    if ( !self.isOpen ) return;
    self.isOpen = false;

    $scope.$emit('$mdMenuClose', $element);
    $mdMenu.hide(null, closeOpts);
    if (!skipFocus) {
      var el = self.restoreFocusTo || $element.find('button')[0];
      if (el instanceof angular.element) el = el[0];
      el.focus();
    }
  }

  /**
   * Build a nice object out of our string attribute which specifies the
   * target mode for left and top positioning
   */
  this.positionMode = function positionMode() {
    var attachment = ($attrs.mdPositionMode || 'target').split(' ');

    // If attachment is a single item, duplicate it for our second value.
    // ie. 'target' -> 'target target'
    if (attachment.length == 1) {
      attachment.push(attachment[0]);
    }

    return {
      left: attachment[0],
      top: attachment[1]
    };
  }

  /**
   * Build a nice object out of our string attribute which specifies
   * the offset of top and left in pixels.
   */
  this.offsets = function offsets() {
    var offsets = ($attrs.mdOffset || '0 0').split(' ').map(parseFloat);
    if (offsets.length == 2) {
      return {
        left: offsets[0],
        top: offsets[1]
      };
    } else if (offsets.length == 1) {
      return {
        top: offsets[0],
        left: offsets[0]
      };
    } else {
      throw Error('Invalid offsets specified. Please follow format <x, y> or <n>');
    }
  }
}