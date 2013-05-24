var github = (function(){
  function escapeHtml(str) {
    return $('<div/>').text(str).html();
  }
  function render(target, events){
    var i = 0, fragment = '', t = $(target)[0];

    for(i = 0; i < events.length; i++) {
        if (events[i].type=="WatchEvent" && events[i].payload.action=="started")
            {fragment += '<li><i class="icon-star"></i> starred <a href="https://github.com/'+events[i].repo.name+'">'+events[i].repo.name+'</a></li>';}
        if (events[i].type=="ForkEvent")
            {fragment += '<li><i class="icon-code-fork"></i> forked <a href="https://github.com/'+events[i].repo.name+'">'+events[i].repo.name+'</a> to <a href="'+events[i].payload.forkee.html_url+'">'+events[i].payload.forkee.full_name+'</a></li>';}
        if (events[i].type=="FollowEvent")
            {fragment += '<li><i class="icon-user"></i> started following <a href="'+events[i].payload.target.html_url+'">'+events[i].payload.target.login+'</a></li>';}
        if (events[i].type=="PushEvent")
            {fragment += '<li><i class="icon-code"></i> pushed to <a href="https://github.com/'+events[i].repo.name+'">'+events[i].repo.name+'</a>';
            for(j = 0; j < events[i].payload.commits.length; j++) {
                fragment += '<br /><small><a href="https://github.com/'+events[i].repo.name+'/commit/'+events[i].payload.commits[j].sha+'">'+events[i].payload.commits[j].sha.substring(0,7)+'</a>: '+events[i].payload.commits[j].message+'</small>';
                }
            fragment += '</li>';}
        if (events[i].type=="GistEvent")
            {fragment += '<li><i class="icon-code"></i> created/modfied <a href="'+events[i].payload.gist.html_url+'">gist: '+events[i].payload.gist.id+'</a><br/><small>'+events[i].payload.gist.description+'</small></li>';}
        if (events[i].type=="PullRequestEvent")
            {fragment += '<li><i class="icon-code"></i> opened pull request <a href="'+events[i].payload.pull_request.html_url+'">'+events[i].repo.name+'#'+events[i].payload.pull_request.number+'</a><br/><small>'+events[i].payload.pull_request.title+'</small></li>';}
    }
    t.innerHTML = fragment;
  }
  return {
    showEvents: function(options){
      $.ajax({
          url: "https://api.github.com/users/"+options.user+"/events?callback=?"
        , dataType: 'jsonp'
        , error: function (err) { $(options.target + ' li.loading').addClass('error').text("Error loading feed"); }
        , success: function(data) {
          var events = [];
          if (!data || !data.data) { return; }
          for (var i = 0; i < data.data.length; i++) {
            events.push(data.data[i]);
          }
          if (options.count) { events.splice(options.count); }
          render(options.target, events);
        }
      });
    }
  };
})();
