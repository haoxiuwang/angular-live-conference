'use strict';

/* global chai: false */

var expect = chai.expect;

describe('Directives', function() {

  beforeEach(function() {
    window.URI = function() {};

    module('op.live-conference');
    module('op.liveconference-templates');
  });

  describe('conferenceUserVideo', function() {

    var element, scope, conferenceState, $modal, matchmedia, callback;

    beforeEach(module(function($provide) {
      conferenceState = {};
      $modal = function() {
        return {
          $promise: {
            then: function() {
              callback();
            }
          }
        };
      };
      matchmedia = {
        isDesktop: function() {}
      };
      $provide.value('currentConferenceState', conferenceState);
      $provide.value('$modal', $modal);
      $provide.value('matchmedia', matchmedia);
      $provide.constant('LOCAL_VIDEO_ID', 'video0');
    }));

    beforeEach(inject(function($compile, $rootScope) {
      scope = $rootScope.$new();
      element = $compile('<conference-user-video/>')(scope);
      $rootScope.$digest();
    }));

    it('should not show modal if currentConferenceState.localVideoId === LOCAL_VIDEO_ID', function() {
      callback = function() {
        throw new Error('should not be here');
      };
      conferenceState.localVideoId = 'video0';
      scope.$digest();
      scope.onMobileToggleControls();
    });

    it('should show modal if currentConferenceState.localVideoId !== LOCAL_VIDEO_ID', function(done) {
      callback = done;
      conferenceState.localVideoId = 'video1';
      scope.$digest();
      scope.onMobileToggleControls();
    });

    describe('The showReportPopup fn', function() {
      window.$ = function() {return [{}];};

      it('should hide modal when called', function(done) {
        callback = done();
        scope.$emit('localVideoId:ready', 1);
        scope.$digest();
        scope.showReportPopup();
      });

      it('should call scope.showReport when attendee is found', function(done) {
        var attendee = {id: 1};
        var localVideoId = 'video1';

        scope.showReport = function(attendee) {
          expect(attendee).to.deep.equal(attendee);
          done();
        };
        callback = function() {};
        conferenceState.getAttendeeByVideoId = function() {
          return attendee;
        };

        scope.$emit('localVideoId:ready', localVideoId);
        scope.$digest();
        scope.showReportPopup();
      });

      it('should not call scope.showReport when attendee is not found', function(done) {
        var localVideoId = 'video1';

        scope.showReport = function() {
          done(new Error());
        };
        callback = function() {};
        conferenceState.getAttendeeByVideoId = function() {
        };

        scope.$emit('localVideoId:ready', localVideoId);
        scope.$digest();
        scope.showReportPopup();
        done();
      });
    });
  });

  describe('The smartFit directive', function() {

    var $rootScope, $compile, parentElement, canvasElement;

    beforeEach(inject(function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    }));

    afterEach(function() {
      if (parentElement) {
        document.body.removeChild(parentElement);
      }
    });

    function canvas(width, height) {
      return '<canvas style="position: absolute;" smart-fit from="#parent" preserve="#preserved" width="' + width + '" height="' + height + '"></canvas>';
    }

    function compileAndAppendCanvas(width, height) {
      var element = $compile(canvas(width, height))($rootScope);
      $rootScope.$digest();

      canvasElement = parentElement.appendChild(element[0]);
    }

    function appendParentDiv(width, height) {
      var div = document.createElement('div');

      div.id = 'parent';
      div.style.position = 'absolute';
      div.style.width = width + 'px';
      div.style.height = height + 'px';
      parentElement = document.body.appendChild(div);
    }

    function appendPreservedElement(left, top, width, height) {
      var div = document.createElement('div');

      div.id = 'preserved';
      div.style.position = 'absolute';
      div.style.left = left + 'px';
      div.style.top = top + 'px';
      div.style.width = width + 'px';
      div.style.height = height + 'px';
      parentElement = document.body.appendChild(div);
    }

    function resizeParent() {
      angular.element('#parent').resize();
    }

    function expectCanvasSize(width, height) {
      var canvas = angular.element('canvas');

      expect(canvas.width()).to.equal(Math.floor(width));
      expect(canvas.height()).to.equal(Math.floor(height));
    }

    it('should throw an error if applied on a non-canvas element', function() {
      expect(function() {
        console.log($compile('<div smart-fit></div>')($rootScope));
      }).to.throw(Error);
    });

    it('should resize canvas when parent is resized', function() {
      appendParentDiv(1980, 1080);
      compileAndAppendCanvas(1280, 720);
      resizeParent();

      expectCanvasSize(1920, 1080);
    });

    it('should resize canvas when localVideoId:ready is broadcast', function() {
      appendParentDiv(1980, 1080);
      compileAndAppendCanvas(1280, 720);
      $rootScope.$broadcast('localVideoId:ready');

      expectCanvasSize(1920, 1080);
    });

    it('Video(480x640) Parent(768x1024) -> Fit height -> 768x1024', function() {
      appendParentDiv(768, 1024);
      compileAndAppendCanvas(480, 640);
      resizeParent();

      expectCanvasSize(768, 1024);
    });

    it('Video(480x640) Parent(1024x768) -> Fit height -> 768x1024', function() {
      appendParentDiv(1024, 768);
      compileAndAppendCanvas(480, 640);
      resizeParent();

      expectCanvasSize(576, 768);
    });

    it('Video(640x360) Parent(768x1024) -> Fit width -> 768x432', function() {
      appendParentDiv(768, 1024);
      compileAndAppendCanvas(640, 360);
      resizeParent();

      expectCanvasSize(768, 432);
    });

    it('Video(640x360) Parent(1024x768) -> Fit width -> 1024x576', function() {
      appendParentDiv(1024, 768);
      compileAndAppendCanvas(640, 360);
      resizeParent();

      expectCanvasSize(1024, 576);
    });

    it('Video(768x1024) Parent(480x640) -> Fit height -> 480x640', function() {
      appendParentDiv(480, 640);
      compileAndAppendCanvas(768, 1024);
      resizeParent();

      expectCanvasSize(480, 640);
    });

    it('Video(768x1024) Parent(640x480) -> Fit height -> 360x480', function() {
      appendParentDiv(640, 480);
      compileAndAppendCanvas(768, 1024);
      resizeParent();

      expectCanvasSize(360, 480);
    });

    it('Video(1280x720) Parent(600x800) -> Fit width -> 600x337', function() {
      appendParentDiv(600, 800);
      compileAndAppendCanvas(1280, 720);
      resizeParent();

      expectCanvasSize(600, 337);
    });

    it('Video(1280x720) Parent(800x600) -> Fit width -> 800x450', function() {
      appendParentDiv(800, 600);
      compileAndAppendCanvas(1280, 720);
      resizeParent();

      expectCanvasSize(800, 450);
    });

    it('should center the canvas vertically, preserving the preserved element if present', function() {
      appendParentDiv(600, 800);
      appendPreservedElement(10, 600, 100, 100);
      compileAndAppendCanvas(1280, 720);
      resizeParent();

      // Computed video height: 337 (see test 'Video(1280x720) Parent(600x800)')
      // Preserved element is top=600
      // 600 - 337 / 2 -> 131.5
      expect(canvasElement.style['margin-top']).to.equal('131.5px');
    });
  });

  describe('The conferenceVideo directive', function() {

    var $rootScope, $compile, $timeout, $window;

    beforeEach(module(function($provide) {
      $provide.value('session', {});
      $provide.value('easyRTCService', {
        isVideoEnabled: function() { return true; }
      });
      $provide.value('$modal', function() {});
      $provide.value('matchmedia', {
        isDesktop: function() { return true; }
      });
      $provide.value('currentConferenceState', {
        videoIds: ['video-thumb0'],
        attendees: [{}]
      });
    }));

    beforeEach(inject(function(_$compile_, _$rootScope_, _$timeout_, _$window_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      $window = _$window_;

      $window.requestAnimationFrame = function() {}; // PhantomJS doesn't have it...

      this.conferenceVideo = $compile('<conference-video />')($rootScope);
      $rootScope.$digest();
      $timeout.flush();
    }));

    it('should redraw the main video when orientation changes', function(done) {
      $rootScope.$on('localVideoId:ready', function() {
        done();
      });

      angular.element($window).trigger('orientationchange');
    });

    it('should resize the attendees bar when receiving attendeesBarSize', function() {
      $rootScope.$emit('attendeesBarSize', {width: 30});
      $rootScope.$apply();

      var attendeesBar = this.conferenceVideo.find('.conference-attendees-bar');
      expect(attendeesBar.css('width')).to.equal('70%');
    });
    it('should resize the attendees bar contents when receiving attendeesBarSize.marginRight', function() {
      $rootScope.$emit('attendeesBarSize', {marginRight: '30px'});
      $rootScope.$apply();

      var attendeesBar = this.conferenceVideo.find('.conference-attendees-bar > .content');
      expect(attendeesBar.css('marginRight')).to.equal('30px');
    });

  });

});
