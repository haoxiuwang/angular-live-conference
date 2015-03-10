angular.module('op.liveconference-templates', []).run(['$templateCache', function($templateCache) {
  "use strict";
  $templateCache.put("templates/application.jade",
    "<div class=\"conference-container\"><div class=\"container-fluid\"><div class=\"row\"><div ng-view></div></div></div></div>");
  $templateCache.put("templates/attendee-video.jade",
    "<div><video id=\"{{videoId}}\" autoplay=\"autoplay\" ng-class=\"{thumbhover: thumbhover}\" ng-mouseenter=\"thumbhover = true &amp;&amp; attendee\" ng-mouseleave=\"thumbhover = false &amp;&amp; attendee\" class=\"conference-attendee-video-multi\"></video><i ng-click=\"mute()\" ng-class=\"{'fa-microphone': !muted, 'fa-microphone-slash': muted}\" ng-show=\"((thumbhover || muted) &amp;&amp; attendee)\" ng-mouseenter=\"thumbhover = true &amp;&amp; attendee\" ng-mouseleave=\"thumbhover = true &amp;&amp; attendee\" class=\"fa fa-3x conference-mute-button\"></i><p class=\"hidden-xs text-center conference-attendee-name\">{{attendee}}</p></div>");
  $templateCache.put("templates/attendee.jade",
    "<div class=\"col-xs-12 media nopadding conference-attendee\"><a href=\"#\" class=\"pull-left\"><img src=\"/images/user.png\" ng-src=\"/api/users/{{user._id}}/profile/avatar\" class=\"media-object thumbnail\"></a><div class=\"media-body\"><h6 class=\"media-heading\">{{user.firstname}} {{user.lastname}}</h6><button type=\"submit\" ng-disabled=\"invited\" ng-click=\"inviteCall(user); invited=true\" class=\"btn btn-primary nopadding\">Invite</button></div><div class=\"horiz-space\"></div></div>");
  $templateCache.put("templates/conference-video.jade",
    "<div id=\"multiparty-conference\" class=\"conference-video\"><div class=\"row\"><conference-user-video video-id=\"{{mainVideoId}}\"></conference-user-video></div><div class=\"row\"><conference-user-control-bar users=\"users\" easyrtc=\"easyrtc\" invite-call=\"invite\" show-invitation=\"showInvitation\" on-leave=\"onLeave\"></conference-user-control-bar></div><div class=\"row conference-row-attendees-bar\"><div class=\"conference-attendees-bar\"><ul class=\"content\"><li ng-repeat=\"id in attendeeVideoIds\" ng-hide=\"!attendees[$index]\"><conference-attendee-video ng-click=\"streamToMainCanvas($index)\" video-id=\"{{id}}\" attendee=\"getDisplayName(attendees[$index])\"></conference-attendee-video></li></ul></div></div></div>");
  $templateCache.put("templates/invite-members.jade",
    "<div class=\"aside\"><div class=\"aside-dialog\"><div class=\"aside-content\"><div class=\"aside-header\"><h4>Members</h4></div><div class=\"aside-body\"><div ng-repeat=\"user in users\" class=\"row\"><conference-attendee></conference-attendee></div></div></div></div></div>");
  $templateCache.put("templates/live.jade",
    "<div class=\"col-xs-12\"><conference-video easyrtc=\"easyrtc\"></conference-video><conference-notification conference-id=\"{{conference._id}}\"></conference-notification></div>");
  $templateCache.put("templates/user-control-bar.jade",
    "<div class=\"col-xs-12 conference-user-control-bar text-center\"><ul class=\"list-inline\"><li><a href=\"\" ng-click=\"showInvitationPanel()\"><i class=\"fa fa-users fa-2x conference-toggle-invite-button\"></i></a></li><li><a href=\"\" ng-click=\"toggleCamera()\"><i ng-class=\"{'fa-eye': !videoMuted, 'fa-eye-slash': videoMuted}\" class=\"fa fa-2x conference-toggle-video-button\"></i></a></li><li><a href=\"\" ng-click=\"toggleSound()\"><i ng-class=\"{'fa-microphone': !muted, 'fa-microphone-slash': muted}\" class=\"fa fa-2x conference-mute-button\"></i></a></li><li><a href=\"\" ng-click=\"leaveConference()\"><i class=\"fa fa-phone fa-2x conference-toggle-terminate-call-button\"></i></a></li></ul></div>");
  $templateCache.put("templates/user-video.jade",
    "<div class=\"col-xs-12 nopadding\"><div ng-mouseenter=\"thumbhover = true\" ng-mouseleave=\"thumbhover = false\" class=\"user-video\"><canvas id=\"mainVideoCanvas\" class=\"conference-main-video-multi\"></canvas></div></div>");
}]);
