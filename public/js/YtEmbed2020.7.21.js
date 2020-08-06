var tag = document.createElement('script');  
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
          
var PlayerArray=[];//所有Yt Embed建立player OBJ
var VideoIdList=[];//所有Yt videoID List
var PlayerArrayNotAutoPlay=[];//不自動scroll play的 playerOBJ的indexOf
var IsAutoPlayScroll=false;//自動撥放的scroll(自動撥放 下一支影片時禁止scroll play)
var ReadyCount=0;//已經載入的video count
var IsYoutubePage=false;//該類別是否 Yt類別
var YtNowVideo=0;//現在撥放第幾隻video
//---Fixed Video Data Control
var FixedVideoIdList=[];//Fixed Yt videoID List
var IsFixedVideoPlaying=false;
 
function BuildYouTubeIframeAPIReady(ListArr,InfoArr) {
    VideoIdList=ListArr;
    PlayerArray=[];
    PlayerArrayNotAutoPlay=[];
    IsAutoPlayScroll=false;
    for(var s=0;s<ListArr.length;s++){
        $('#Outer').append(`
        <div key="${s}" class="videoplayer">
            <div id="player${s}"></div>
            <div>
                <p>${InfoArr[s]['title']}</p>
                <p>${InfoArr[s]['time']}</p>
                <p>觀看次數:${InfoArr[s]['views']}
                <button class='fivideobtn' onclick='FixedPlayerBuildYoutubeVideo("${ListArr[s]}")'>
                固定撥放</button>
                </p>
            </div>
        </div>
        
        `);
    }
    for(var s=0;s<ListArr.length;s++){
        let Wdd=parseInt($('.videoplayer').width());        
        if(Wdd>640)Wdd=640;//640*390
        var LitPlayer = new YT.Player(`player${s}`, {        
            height: `${Wdd*0.6}`,
            width: `${Wdd}`,
            videoId: `${ListArr[s]}`,
            playerVars: { //自訂參數                 
                'loop':1,
                'playlist':`${ListArr[s]}`,              
                },
            events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
            }
        });
        PlayerArrayNotAutoPlay.push(true);
        PlayerArray.push(LitPlayer);
    }    
}
function onPlayerReady(event) {
    ReadyCount++;
    console.log(`Trigger Player Ready`)
    if(PlayerArray[0].getPlayerState()!==1&&IsFixedVideoPlaying==false){
        PlayerArray[0].playVideo();
    }
}  
function onPlayerStateChange(event) {
    // console.log(event.target.getPlayerState())
    // console.log(event.target.getPlaylist());
    // console.log(document[Browserhidden]+"||"+event.target.getPlayerState());
    // console.log(document[Browserhidden]+"||"+event.target.getPlaylist()[0]);
    //let TheCtn=VideoIdList.indexOf(event.target.getPlaylist()[0])
    //console.log(GetVideoIdByUrl(event.target.getVideoUrl()));
    let TheCtn=VideoIdList.indexOf(GetVideoIdByUrl(event.target.getVideoUrl()));    
    if(event.target.getPlayerState()==2&&YtNowVideo==TheCtn){//是"使用者"手動暫停影片 -> 停止這支影片的自動撥放        
        if(PlayerArrayNotAutoPlay.includes(TheCtn)==false)PlayerArrayNotAutoPlay.push(TheCtn);
    }
    else if(event.target.getPlayerState()==1){//使用者 play自動撥放中的video        
        if(IsFixedVideoPlaying){//手動Play content內video -> 關掉FixedVideo系統
            CloseFixedVideo();
        }
        PlayerArrayNotAutoPlay[PlayerArrayNotAutoPlay.indexOf(TheCtn)]=-1;//移除禁播名單
        PlaySingleVideo(TheCtn);//執行撥放
    }
    //----------2020.7.14 新增 撥放自動下一隻video & scroll to    
    else if(event.target.getPlayerState()==0&&document[Browserhidden]==false){//影片end 撥放下一隻video        
        let nnb=0;
        if(TheCtn<VideoIdList.length-1)nnb=TheCtn+1;
        IsAutoPlayScroll=true;
        $('html, body').animate({
            scrollTop: $(".videoplayer").eq(nnb).offset().top
        },500,function(){
            PlaySingleVideo(nnb);            
        });
    }
    //------------------------------------------------------*/    
}
function AllstopVideo() {//全部停止  
  PlayerArray.forEach(function(item, index) {
    item.stopVideo();
  })
}
function PauseOtherVideo(){//全部暫停  
  PlayerArray.forEach(function(item, index) {
    if(index!==YtNowVideo)item.pauseVideo();
  })
}
function PausePlayingSingleVideo(){//暫停 正在撥放的video
    PlayerArray[YtNowVideo].pauseVideo();    
}
function PlaySingleVideo(N){//停止其他video 播單支
    //console.log('Trigger Play Single');
    // YtNowVideo=N;//播放第N個 video
    // PauseOtherVideo();//暫停全部(除了第N個)    
    if(YtNowVideo==N)return ;//該隻video正在撥放
    if(YtNowVideo!==-1){//關掉Fixed 開始Scroll Auto Play        
        PausePlayingSingleVideo();
    }
    YtNowVideo=N;
    if(PlayerArrayNotAutoPlay.includes(N)==false
    &&PlayerArray[N].getPlayerState()!==1){//如果第N不再禁止AutoPlay名單 && 第N 沒有正在撥放        
        PlayerArray[N].playVideo();//第N撥放        
        IsAutoPlayScroll=false;//可以自動scroll撥放
    }
}
function AutoPlayLoadNextVideo(N){//(X)(Browser遮蔽無法使用)Auto Play Next當browser不在視窗內
    console.log('Trigger Auto Play ');
    // YtNowVideo=N;//播放第N個 video
    // PauseOtherVideo();//暫停全部(除了第N個)
    PausePlayingSingleVideo();
    YtNowVideo=N;
    if(PlayerArrayNotAutoPlay.includes(N)==false
    &&PlayerArray[N].getPlayerState()!==1){//如果第N不再禁止AutoPlay名單 && 第N 沒有正在撥放                
        PlayerArray[N].loadVideoById(`${VideoIdList[N]}`,0);        
        //PlayerArray[N].loadPlaylist(`${VideoIdList[N]}`,0,0);
    }
}
$(window).scroll(function(){
    //是在 youtube page scroll auto play
    if(IsYoutubePage&&IsAutoPlayScroll==false&&IsFixedVideoPlaying==false){
        for(var s=0;s<PlayerArray.length;s++){
            if(isScrolledIntoView($('#Outer .videoplayer').eq(s))){//ele 在window 內
              //console.log(`${s}播放狀態:${PlayerArray[s].getPlayerState()}`)
              //console.log(s+'Scroll In!!!');
              const TheNb=parseInt($('#Outer .videoplayer').eq(s).attr('key'));
              PlaySingleVideo(TheNb);
              break;
            }            
        }
    }    
});
function isScrolledIntoView(elem)//判斷ele 是否在window內 (return true/false)
{       
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
function GetVideoIdByUrl(TheUrl){//Parse Url to Get VideoID
    let nb0=TheUrl.indexOf('v=')+2;
    let nb1=TheUrl.length;
    return TheUrl.slice(nb0,nb1);    
}

//--------------------Fixed Video Build--------------------------------------------
function FixedPlayerBuildYoutubeVideo(ViID){//建立 Yt PlayerElement
    console.log(ViID);
    IsFixedVideoPlaying=true;
    FixedVideoIdList=VideoIdList;//List 繼承/傳遞
    YtNowVideo=-1;
    PauseOtherVideo();
    $('#YtInfinityPlayer').empty();
    //<button class='fivideobtn' onclick="FixedVideoPlay(-1)">Pre</button>
    //<button class='fivideobtn' onclick="FixedVideoPlay(1)">Next</button>    
    $('#YtInfinityPlayer').append(`
        <p>            
        <button class='fivideobtn' onclick="CloseFixedVideo()">停止撥放</button>        
        </p>
        <div id="FixedPlayer"></div>
    `);
    new YT.Player(`FixedPlayer`, {
        width: `360`,
        height: `240`,
        videoId: `${ViID}`,
        playerVars: { //自訂參數                 
            'loop':1,
            'playlist':`${ViID}`,
            },
        events: {
            'onReady': FixedonPlayerReady,
            'onStateChange': FixedonPlayerStateChange
        }
    });
}
function FixedonPlayerReady(event){//Fixed Video 初始化play
    event.target.playVideo();
}
function FixedonPlayerStateChange(event){//Fixed Video判斷auto play next    
    if(event.target.getPlayerState()==0){//(Browser不在視窗內可以Play Next)Play Next Video
        // console.log(FixedVideoIdList.indexOf(event.target.getPlaylist()[0]));
        // console.log(event.target.getPlaylist()[0]);
        let NowNB=FixedVideoIdList.indexOf(event.target.getPlaylist()[0])
        let NextNb=NowNB+1;
        if(NowNB==FixedVideoIdList.length-1)NextNb=0;        
        event.target.loadPlaylist(`${FixedVideoIdList[NextNb]}`,0,0);
        //event.target.playVideo();
    }    
}
function CloseFixedVideo(){//關掉 Fixed Video Panel
    $('#YtInfinityPlayer').empty();
    IsFixedVideoPlaying=false;
}
//--------------------Fixed Video Build--------------------------------------------