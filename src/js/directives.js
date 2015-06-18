'use strict';

angular.module('op.live-conference')
  .directive('conferenceVideo', ['$timeout', '$window', '$rootScope', 'drawVideo', 'currentConferenceState', 'LOCAL_VIDEO_ID', 'DEFAULT_AVATAR_SIZE',
  function($timeout, $window, $rootScope, drawVideo, currentConferenceState, LOCAL_VIDEO_ID, DEFAULT_AVATAR_SIZE) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/conference-video.jade',
      link: function(scope, element) {
        var canvas = {};
        var context = {};
        var mainVideo = {};
        var stopAnimation = function() {};

        function garbage() {
          stopAnimation();
          canvas = {};
          context = {};
          mainVideo = {};
          stopAnimation = function() {};
        }

        function drawVideoInCanvas() {
          canvas[0].width = mainVideo[0].videoWidth || DEFAULT_AVATAR_SIZE;
          canvas[0].height = mainVideo[0].videoHeight || DEFAULT_AVATAR_SIZE;
          stopAnimation = drawVideo(context, mainVideo[0], canvas[0].width, canvas[0].height);

          $rootScope.$broadcast('localVideoId:ready', mainVideo[0].id);
        }

        $timeout(function() {
          canvas = element.find('canvas#mainVideoCanvas');
          context = canvas[0].getContext('2d');
          mainVideo = element.find('video#' + LOCAL_VIDEO_ID);
          mainVideo.on('loadedmetadata', function() {
            if ($window.mozRequestAnimationFrame) {
              // see https://bugzilla.mozilla.org/show_bug.cgi?id=926753
              // Firefox needs this timeout.
              $timeout(function() {
                drawVideoInCanvas();
              }, 500);
            } else {
              drawVideoInCanvas();
            }
          });
        }, 1000);

        scope.conferenceState = currentConferenceState;

        scope.$on('conferencestate:localVideoId:update', function(event, newVideoId) {
          // Reject the first watch of the mainVideoId
          // when clicking on a new video, loadedmetadata event is not
          // fired.
          if (!mainVideo[0]) {
            return;
          }
          mainVideo = element.find('video#' + newVideoId);
          drawVideoInCanvas();
        });

        scope.streamToMainCanvas = function(index) {
          return scope.conferenceState.updateLocalVideoIdToIndex(index);
        };

        scope.$on('$destroy', garbage);

        $rootScope.$on('paneSize', function(event, paneSize) {
          if (paneSize.width !== undefined) {
            scope.paneStyle = {width: (100 - paneSize.width) + '%'};
          }
          if (paneSize.height !== undefined) {
            scope.paneStyle = {width: (100 - paneSize.height) + '%'};
          }

        });

        $rootScope.$on('attendeesBarSize', function(event, paneSize) {
          if (paneSize.width !== undefined) {
            scope.attendeesBarStyle = {width: (100 - paneSize.width) + '%'};
          }
          if (paneSize.height !== undefined) {
            scope.attendeesBarStyle = {width: (100 - paneSize.height) + '%'};
          }

          if (paneSize.marginRight !== undefined) {
            scope.attendeesBarContentStyle = {'margin-right': paneSize.marginRight};
          }

        });

        angular.element($window).on('orientationchange', drawVideoInCanvas);
      }
    };
  }])

  .directive('conferenceAttendee', function() {
    return {
      restrict: 'E',
      templateUrl: 'templates/attendee.jade'
    };
  })

  .directive('conferenceAttendeeVideo', ['easyRTCService', 'currentConferenceState', 'matchmedia', function(easyRTCService, currentConferenceState, matchmedia) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/attendee-video.jade',
      scope: {
        attendee: '=*',
        videoId: '@',
        onVideoClick: '=',
        videoIndex: '=',
        showReport: '='
      },
      link: function(scope) {

        scope.showReportPopup = function() {
          scope.showReport(scope.attendee);
        };

        scope.toggleAttendeeMute = function() {
          var mute = scope.attendee.localmute;
          easyRTCService.muteRemoteMicrophone(scope.attendee.easyrtcid, !mute);
          currentConferenceState.updateLocalMuteFromEasyrtcid(scope.attendee.easyrtcid, !mute);
        };

        scope.isDesktop = matchmedia.isDesktop();
      }
    };
  }])

  .directive('conferenceUserVideo', ['$modal', 'currentConferenceState', 'matchmedia', 'LOCAL_VIDEO_ID', function($modal, currentConferenceState, matchmedia, LOCAL_VIDEO_ID) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/user-video.jade',
      link: function(scope) {

        var modal = $modal({
          scope: scope,
          animation: 'am-fade-and-scale',
          placement: 'center',
          template: 'templates/mobile-user-video-quadrant-control.jade',
          container: 'div.user-video',
          backdrop: 'static',
          show: false
        });

        scope.onMobileToggleControls = function() {
          if (matchmedia.isDesktop()) {
            return;
          }
          if (currentConferenceState.localVideoId === LOCAL_VIDEO_ID) {
            return;
          }
          modal.$promise.then(modal.toggle);
        };

        var mainVideo = {};
        var videoElement = {};
        var watcher = {};

        scope.$on('localVideoId:ready', function(event, videoId) {
          if (watcher instanceof Function) {
            // we must unregister previous watcher
            // if it has been initialized first
            watcher();
          }
          mainVideo = $('video#' + videoId);
          videoElement = mainVideo[0];
          scope.muted = videoElement.muted;

          scope.mute = function() {
            videoElement.muted = !videoElement.muted;
            scope.onMobileToggleControls();
          };

          scope.showReportPopup = function() {
            scope.onMobileToggleControls();
            var attendee = currentConferenceState.getAttendeeByVideoId(videoId);
            if (!attendee) {
              return;
            }
            scope.showReport(attendee);
          };

          watcher = scope.$watch(function() {
            return videoElement.muted;
          }, function() {
            scope.muted = videoElement.muted;
          });
        });
      }
    };
  }])

  .directive('conferenceUserControlBar', function($log, easyRTCService) {
    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'templates/user-control-bar.jade',
      scope: {
        showInvitation: '=',
        onLeave: '=',
        conferenceState: '=',
        showEditor: '='
      },
      link: function($scope) {
        $scope.muted = false;
        $scope.videoMuted = false;

        $scope.noVideo = !easyRTCService.isVideoEnabled();

        $scope.toggleSound = function() {
          easyRTCService.enableMicrophone($scope.muted);

          $scope.muted = !$scope.muted;
          $scope.conferenceState.updateMuteFromIndex(0, $scope.muted);

          easyRTCService.broadcastMe();
        };

        $scope.toggleCamera = function() {
          easyRTCService.enableCamera($scope.videoMuted);
          easyRTCService.enableVideo($scope.videoMuted);

          $scope.videoMuted = !$scope.videoMuted;
          $scope.conferenceState.updateMuteVideoFromIndex(0, $scope.videoMuted);

          easyRTCService.broadcastMe();
        };

        $scope.showInvitationPanel = function() {
          $scope.showInvitation();
        };

        $scope.leaveConference = function() {
          $scope.onLeave();
        };
        $scope.toggleEditor = function() {
          $scope.showEditor();
        };
      }
    };
  })
  .directive('scaleToCanvas', ['$interval', '$window', 'cropDimensions', 'drawAvatarIfVideoMuted', 'drawHelper',
    function($interval, $window, cropDimensions, drawAvatarIfVideoMuted, drawHelper) {

    var requestAnimationFrame =
      $window.requestAnimationFrame ||
      $window.mozRequestAnimationFrame ||
      $window.msRequestAnimationFrame ||
      $window.webkitRequestAnimationFrame;

    function link(scope, element, attrs) {

      var widgets = [];
      var toggleAnim = false;
      var stopScaling = false;

      function videoToCanvas(widget) {
        var canvas = widget.canvas,
            ctx = widget.context,
            vid = widget.video,
            width = canvas.width,
            height = canvas.height,
            vHeight = vid.videoHeight,
            vWidth = vid.videoWidth;

        if (!height || !width) {
          return;
        }

        drawAvatarIfVideoMuted(vid.id, ctx, width, height, function() {
          var cropDims = cropDimensions(width, height, vWidth, vHeight);

          drawHelper.drawImage(ctx, vid, cropDims[0], cropDims[1], cropDims[2], cropDims[2], 0, 0, width, height);
        });
      }

      $interval(function cacheWidgets() {
        element.find('video').each(function(index, vid) {
          var canvas = element.find('canvas[data-video-id=' + vid.id + ']').get(0);
          widgets.push({
            video: vid,
            canvas: canvas,
            context: canvas.getContext('2d')
          });
        });
      }, 100, 1, false);

      function onAnimationFrame() {
        if ((toggleAnim = !toggleAnim)) {
          widgets.forEach(videoToCanvas);
        }
        if (stopScaling) {
          return;
        }
        requestAnimationFrame(onAnimationFrame);
      }

      function garbage() {
        stopScaling = true;
        widgets = [];
      }

      scope.$on('$destroy', garbage);

      onAnimationFrame();
    }

    return {
      restrict: 'A',
      link: link
    };
  }])
  .directive('localSpeakEmitter', ['$rootScope', 'session', 'currentConferenceState', 'easyRTCService', 'speechDetector', function($rootScope, session, currentConferenceState, easyRTCService, speechDetector) {
    function link(scope) {
      function createLocalEmitter(stream) {
        var detector = speechDetector(stream);
        scope.$on('$destroy', function() {
          detector.stop();
          detector = null;
        });
        detector.on('speaking', function() {
          currentConferenceState.updateSpeaking(easyRTCService.myEasyrtcid(), true);
          easyRTCService.broadcastMe();
        });
        detector.on('stopped_speaking', function() {
          currentConferenceState.updateSpeaking(easyRTCService.myEasyrtcid(), false);
          easyRTCService.broadcastMe();
        });
      }

      var unreg = $rootScope.$on('localMediaStream', function(event, stream) {
        unreg();
        createLocalEmitter(stream);
      });
    }

    return {
      restrict: 'A',
      link: link
    };
  }])
  .directive('autoVideoSwitcher', ['$rootScope', 'AutoVideoSwitcher', 'currentConferenceState', function($rootScope, AutoVideoSwitcher, currentConferenceState) {
    return {
      restrict: 'A',
      link: function() {
        var unreg = $rootScope.$on('localMediaStream', function() {
          unreg();
          new AutoVideoSwitcher(currentConferenceState);
        });
      }
    };
  }])
  .directive('smartFit', ['$rootScope', function($rootScope) {
    return {
      restrict: 'A',
      replace: true,
      link: function(scope, element, attrs) {
        if (element[0].tagName !== 'CANVAS') {
          throw new Error('The smartFit directive can only be applied to a HTML Canvas.');
        }

        var unregisterRootScopeListener,
            source = angular.element(attrs.from),
            toPreserve = angular.element(attrs.preserve);

        function smartFit() {
          var canvas = element[0],
            availWidth = source.width(),
            availHeight = source.height(),
            width = canvas.width,
            height = canvas.height,
            videoAspectRatio = width / height,
            containerAspectRatio = availWidth / availHeight;

          function fitWidth() {
            width = availWidth;
            height = Math.floor(width / videoAspectRatio);
          }

          function fitHeight() {
            height = availHeight;
            width = Math.floor(height * videoAspectRatio);
          }

          if (videoAspectRatio > containerAspectRatio) {
            fitWidth();
          } else {
            fitHeight();
          }

          canvas.style.width = width + 'px';
          canvas.style.height = height + 'px';

          if (toPreserve.length) {
            canvas.style['margin-top'] = Math.max(0, (toPreserve.position().top - height) / 2) + 'px';
          }
        }

        source.resize(smartFit);
        unregisterRootScopeListener = $rootScope.$on('localVideoId:ready', smartFit);

        scope.$on('$destroy', function() {
          source.off('resize', smartFit);
          unregisterRootScopeListener();
        });
      }
    };
  }]);
