import client from 'Client'
import {
  CHAT_CONNECT_SUCCESS,
  GROUP_CHANNELS_GET_ERROR,
  GROUP_CHANNELS_GET_SUCCESS,
  GROUP_CHANNELS_GET_HISTORY_SUCCESS,
  GROUP_CHANNELS_MESSAGE_RECEIVED_SUCCESS,
  GROUP_CHANNELS_INVITE_ACCEPTANCE_REQUIRED,
  GROUP_CHANNELS_INVALID_PARTICIPANT,
  SET_SMART_CHAT_TYPE,
  GROUP_CHANNELS_OPEN,
  GROUP_CHANNELS_MINIMIZE,
  GROUP_CHANNELS_CREATE,
  GROUP_CHANNELS_HIDE,
  GROUP_CHANNELS_LIST_SUCCESS,
  GROUP_CHANNELS_MY_LIST_SUCCESS,
  OPEN_CHANNELS_LIST_SUCCESS,
  GROUP_CHANNELS_LEAVE_SUCCESS,
  OPEN_CHANNELS_OPEN,
  OPEN_CHANNELS_MINIMIZE,
  OPEN_CHANNELS_CREATE,
  OPEN_CHANNELS_GET_SUCCESS,
  OPEN_CHANNELS_GET_HISTORY_SUCCESS,
  OPEN_CHANNELS_MESSAGE_RECEIVED_SUCCESS,
  OPEN_CHANNELS_CLOSE,
  OPEN_CHANNELS_REMOVE_HISTORY,
  SMART_CHAT_OPEN,
  SMART_CHAT_CLOSE,
  USER_LIST_SUCCESS
} from 'state/action-types'

import Utility from 'utility/Utility'

import * as Debug from 'debug';
const debug = Debug('chatcamp:middleware')

export const iFlyMiddleWare = store => {
  let userId;
  if(window.ChatCampData && window.ChatCampData.userId){
    userId = window.ChatCampData.userId
  }
  if(Utility.getUrlQueryParams(window.location.href)['userId'] && Utility.getUrlQueryParams(window.location.href)['userId'][0]) {
    userId = Utility.getUrlQueryParams(window.location.href)['userId'][0]
  }

  let accessToken;
  if(window.ChatCampData && window.ChatCampData.accessToken){
    accessToken = window.ChatCampData.accessToken
  }
  if(Utility.getUrlQueryParams(window.location.href)['accessToken'] && Utility.getUrlQueryParams(window.location.href)['accessToken'][0]) {
    accessToken = Utility.getUrlQueryParams(window.location.href)['accessToken'][0]
  }

  // to expose startchat to other platforms
  let startChat = (groupChannelId) => {
    if(Utility.mobileCheck()){
      var el = document.getElementById('cc-app-inner');
      if(el) {
        el.className = 'cc-app-mobile'
      }
    }
    _startGroupChannel(groupChannelId)
    store.dispatch({
      type: GROUP_CHANNELS_OPEN,
      groupChannelsId: groupChannelId
    })
  }

  let startChannelChat = (channelId, channelType) => {
    if(Utility.mobileCheck()){
      var el = document.getElementById('cc-app-inner');
      if(el) {
        el.className = 'cc-app-mobile'
      }
    }
    if(channelType === "group"){
      startChat(channelId)
    }
    else if(channelType === "open"){
      _startOpenChannel(channelId)
      store.dispatch({
        type: OPEN_CHANNELS_OPEN,
        openChannelsId: channelId
      })
    }
    else if(channelType === "roster"){
      store.dispatch({
        type: SMART_CHAT_OPEN
      })
    }
  }

  // client.connect(userId, accessToken, "localhost", "9080", function(e, user) {
  // client.connect(userId, "localhost", "9080", function(e, user) {
  client.connect(userId, accessToken, function(e, user) {
  // client.connect(userId, function(e, user) {
    if(e==null) {
      // client.updateUserDisplayName(userId, "ws://192.168.2.145", "9080", function(e, user) {
        window.ChatCampUI = {}
        window.ChatCampUI.startChat = startChat
        window.ChatCampUIKit = {}
        window.ChatCampUIKit.startChat = startChannelChat
        let groupChannelId1
        var allGroupChannels = []
        if(Utility.getUrlQueryParams(window.location.href)['groupChannelId'] && Utility.getUrlQueryParams(window.location.href)['groupChannelId'][0]) {
          groupChannelId1 = Utility.getUrlQueryParams(window.location.href)['groupChannelId'][0]
          allGroupChannels[0] = groupChannelId1
        }

        user["appId"] = client.app.id
        let allOpenChannels = [];
        let storeChannels = store.getState().groupChannelsState.keySeq().toArray()
        store.getState().groupChannelsState.map((rosterItem, index) => {
          if(rosterItem.getIn(["type"]) === "open"){
            allOpenChannels.push(index)
          }
          else if(rosterItem.getIn(["type"]) === "group"){
            allGroupChannels.push(index)
          }
        })

        let storeUserId = store.getState().user.get("id")
        debug("smartChat Store", storeUserId)
        if(storeUserId === false && !Utility.mobileCheck())
        if(process.env.REACT_APP_CHATCAMP_LIST_PANEL_OPEN_DEFAULT === "TRUE"){
          store.dispatch({
            type: SMART_CHAT_OPEN
          })
        }
        else if(process.env.REACT_APP_CHATCAMP_LIST_PANEL_OPEN_DEFAULT === "FALSE"){
          store.dispatch({
            type: SMART_CHAT_CLOSE
          })
        }

        store.dispatch({
          type: CHAT_CONNECT_SUCCESS,
          user: user
        });
        store.dispatch({
          type: SET_SMART_CHAT_TYPE,
          data: {type: "popup"} //popup or embed
        });

        
        

      if(!Utility.mobileCheck()){
        for(let i in allGroupChannels){
          let groupChannelId = allGroupChannels[i]
          _startGroupChannel(groupChannelId)
        }

        for(let i in allOpenChannels){
          let openChannelId = allOpenChannels[i]
          _startOpenChannel(openChannelId)
        }
      }


        let channelListener = new client.ChannelListener();
        channelListener.onGroupChannelMessageReceived = function(groupChannel, message) {
          debug("Listener", groupChannel, message)
          // automatic opening of chat in case of new message
          let state = store.getState().groupChannelsState.getIn([groupChannel.id, "state"])
          let groupChannelsState = store.getState().groupChannelsState
          let groupChannels = store.getState().groupChannels
            let count = 0
            let first = false;
            let max = Math.floor(window.innerWidth/368)
            groupChannels.map((window, id) => {
              if(groupChannelsState.getIn([window.get('id'), "state"]) === "HIDDEN"){
                  count++
                  first = true
              }
            })
          if(state !== "OPEN" && store.getState().smartChat.getIn(["type"]) === "popup" && !Utility.mobileCheck()){
            _startGroupChannel(groupChannel.id)
            if(first){
              store.dispatch({
                type: GROUP_CHANNELS_HIDE,
                groupChannelsId: groupChannel.id
              })
            }
            else if(count === max){
              store.dispatch({
                type: GROUP_CHANNELS_HIDE,
                groupChannelsId: groupChannel.id
              })
            }
            else{
              if(!Utility.mobileCheck()){
                store.dispatch({
                  type: GROUP_CHANNELS_OPEN,
                  groupChannelsId: groupChannel.id
                })
              }
            }

          }
          store.dispatch({
            type: GROUP_CHANNELS_MESSAGE_RECEIVED_SUCCESS,
            groupChannel: groupChannel,
            message: message
          });
          store.dispatch({
            type: GROUP_CHANNELS_GET_SUCCESS,
            groupChannel: groupChannel
          });
        }

        channelListener.onGroupChannelParticipantJoined = function(groupChannel, user) {
          debug("groupchannel joined", groupChannel, user)
          store.dispatch({
            type: GROUP_CHANNELS_GET_SUCCESS,
            groupChannel: groupChannel
          });
        }

        channelListener.onGroupChannelParticipantLeft = function(groupChannel, user) {
          debug("groupchannel left", groupChannel, user)
          if(user.id === userId){
            store.dispatch({
              type: GROUP_CHANNELS_LEAVE_SUCCESS,
              groupChannel: groupChannel
            });
          }
          store.dispatch({
            type: GROUP_CHANNELS_GET_SUCCESS,
            groupChannel: groupChannel
          });
        }

        channelListener.onOpenChannelMessageReceived = function(openChannel, message) {
          store.dispatch({
            type: OPEN_CHANNELS_MESSAGE_RECEIVED_SUCCESS,
            openChannel: openChannel,
            message: message
          });
        }

        channelListener.onOpenChannelParticipantJoined = function(openChannel, user) {
          debug("openchannel joined", openChannel, user)
          store.dispatch({
            type: OPEN_CHANNELS_GET_SUCCESS,
            openChannel: openChannel
          });

          if(user.id === userId){
            let previousMessageListQuery = openChannel.createPreviousMessageListQuery();
            previousMessageListQuery.load(20, null, function(previousMessageListQueryError, messages) {
              store.dispatch({
                type: OPEN_CHANNELS_GET_HISTORY_SUCCESS,
                openChannel: openChannel,
                messages: messages
              });
            })
          }

        }

        channelListener.onOpenChannelParticipantLeft = function(openChannel, user) {
          debug("openchannel left", openChannel, user)
          store.dispatch({
            type: OPEN_CHANNELS_GET_SUCCESS,
            openChannel: openChannel
          });
          if(user.id === userId){
            store.dispatch({
              type: OPEN_CHANNELS_CLOSE,
              openChannelsId: openChannel.id
            })
            store.dispatch({
              type: OPEN_CHANNELS_REMOVE_HISTORY,
              openChannelsId: openChannel.id
            })
          }
        }

        channelListener.onGroupChannelTypingStatusChanged = function(groupChannel) {
          debug("Typing Status", groupChannel, groupChannel.getTypingParticipants())
          store.dispatch({
            type: GROUP_CHANNELS_GET_SUCCESS,
            groupChannel: groupChannel
          });
        }

        channelListener.onGroupChannelReadStatusUpdated = function(groupChannel) {
          debug("Read Status Update", groupChannel)
          store.dispatch({
            type: GROUP_CHANNELS_GET_SUCCESS,
            groupChannel: groupChannel
          });
        }

        client.addChannelListener("t", channelListener)

        function pollGroupChannelList() {
          var groupChannelListQuery = client.GroupChannel.createGroupChannelListQuery();
          groupChannelListQuery.get(function(error, groupChannelList){
  	         if(error == null){
    	          // debug("My Group Channels List Retreived", groupChannelList)
                store.dispatch({
                  type: GROUP_CHANNELS_LIST_SUCCESS,
                  groupChannels: groupChannelList
                });
                store.dispatch({
                  type: GROUP_CHANNELS_MY_LIST_SUCCESS,
                  groupChannels: groupChannelList
                });
                for(let i in groupChannelList){
                  if(groupChannelList[i].participantsCount === 2 && groupChannelList[i].isDistinct === true){
                    client.GroupChannel.get(groupChannelList[i].id, function(error, groupChannel) {
                      if(!error){
                        store.dispatch({
                          type: GROUP_CHANNELS_GET_SUCCESS,
                          groupChannel: groupChannel
                        });
                      }
                    })
                  }
                }
              }
          })
          //setTimeout(function() { pollGroupChannelList() }, 30*1000)
        }

        pollGroupChannelList()

        var openChannelListQuery = client.OpenChannel.createOpenChannelListQuery();
        openChannelListQuery.get(function(error, openChannelList){
	         if(error == null){
  	          debug("My Open Channels List Retreived", openChannelList)
              store.dispatch({
                type: OPEN_CHANNELS_LIST_SUCCESS,
                openChannels: openChannelList
              });
            }
        })

        function pollUserList() {
          var userListQuery = client.createUserListQuery();
          userListQuery.load(function(error, userList){
  	         if(error == null){
                store.dispatch({
                  type: USER_LIST_SUCCESS,
                  userList: userList
                });
              }

          })
          setTimeout(function() { pollUserList() }, 30*1000)
        }
        pollUserList()

      // });
    }
    else {

    }
  });

  let _startGroupChannel = (groupChannelId) => {
    client.GroupChannel.get(groupChannelId, function(error, groupChannel) {
      if(error==null) {
        // store.dispatch({
        //   type: SET_SMART_CHAT_TYPE,
        //   data: {type: "popup"} //popup or embed
        // });
        store.dispatch({
          type: GROUP_CHANNELS_GET_SUCCESS,
          groupChannel: groupChannel
        });
        let state = store.getState().groupChannelsState.getIn([groupChannel.id, "state"])
        if(state === "OPEN"){
          store.dispatch({
            type: GROUP_CHANNELS_OPEN,
            groupChannelsId: groupChannel.id
          })
        }
        else if(state === "MINIMIZE"){
          store.dispatch({
            type: GROUP_CHANNELS_MINIMIZE,
            groupChannelsId: groupChannel.id
          })
        }
        else if( state === undefined){
          store.dispatch({
            type: GROUP_CHANNELS_CREATE,
            groupChannelsId: groupChannel.id
          })
        }


        // Check if the current user is participants of this groupChannelLeave
        let isCurrentUserAcceptedParticipant = false;
        let isCurrentUserParticipant = false;
        for (let i in groupChannel.participants) {
          let participant = groupChannel.participants[i]
          if(participant.id === client.user.id) {
            isCurrentUserParticipant = true
            if(participant.status === "accepted") {
              isCurrentUserAcceptedParticipant = true
            }
          }
        }

        if(isCurrentUserParticipant && isCurrentUserAcceptedParticipant) {
          let messages = store.getState().groupChannels.getIn([groupChannel.id, "messages"])
          if(!messages){
            let previousMessageListQuery = groupChannel.createPreviousMessageListQuery();
            previousMessageListQuery.load(20, null, function(previousMessageListQueryError, messages) {
              store.dispatch({
                type: GROUP_CHANNELS_GET_HISTORY_SUCCESS,
                groupChannel: groupChannel,
                messages: messages
              });
            })
          }

          setInterval(function(){
            groupChannel.sync(function(error,groupChannel){
              if(error == null){
                store.dispatch({
                  type: GROUP_CHANNELS_GET_SUCCESS,
                  groupChannel: groupChannel
                });
              }
            })
          }, 30000)
        }
        else if(isCurrentUserParticipant && !isCurrentUserAcceptedParticipant){
          store.dispatch({
            type: GROUP_CHANNELS_INVITE_ACCEPTANCE_REQUIRED,
            groupChannel: groupChannel
          });
        }
        else {
          store.dispatch({
            type: GROUP_CHANNELS_INVALID_PARTICIPANT,
            groupChannel: groupChannel
          });
        }
      }
      else {
        store.dispatch({
          type: GROUP_CHANNELS_GET_ERROR,
          error: error,
          groupChannelId: groupChannelId
        });
      }
    });
  }

  let _startOpenChannel = (openChannelId) => {
    client.OpenChannel.get(openChannelId, function(error, openChannel) {
      if(error==null) {
        // store.dispatch({
        //   type: SET_SMART_CHAT_TYPE,
        //   data: {type: "popup"} //popup or embed
        // });
        client.OpenChannel.get(openChannelId, function(error, openChannel) {
          // groupChannel.stopTyping()
          openChannel.join(function(error, message) {
            let messages = store.getState().openChannels.getIn([openChannel.id, "messages"])
            if(!messages){
            let previousMessageListQuery = openChannel.createPreviousMessageListQuery();
            previousMessageListQuery.load(20, null, function(previousMessageListQueryError, messages) {
              store.dispatch({
                type: OPEN_CHANNELS_GET_HISTORY_SUCCESS,
                openChannel: openChannel,
                messages: messages
              });
            })
          }
          })
        })
        store.dispatch({
          type: OPEN_CHANNELS_GET_SUCCESS,
          openChannel: openChannel
        });
        let state = store.getState().groupChannelsState.getIn([openChannel.id, "state"])
        if(state === "OPEN"){
          store.dispatch({
            type: OPEN_CHANNELS_OPEN,
            openChannelsId: openChannel.id
          })
        }
        else if(state === "MINIMIZE"){
          store.dispatch({
            type: OPEN_CHANNELS_MINIMIZE,
            openChannelsId: openChannel.id
          })
        }
        else if( state === undefined){
          store.dispatch({
            type: OPEN_CHANNELS_CREATE,
            openChannelsId: openChannel.id
          })
        }

        //
        // if(isCurrentUserParticipant && isCurrentUserAcceptedParticipant) {
        //   let previousMessageListQuery = groupChannel.createPreviousMessageListQuery();
        //   previousMessageListQuery.load(20, null, function(previousMessageListQueryError, messages) {
        //     store.dispatch({
        //       type: GROUP_CHANNELS_GET_HISTORY_SUCCESS,
        //       groupChannel: groupChannel,
        //       messages: messages
        //     });
        //   })
        //
        //   setInterval(function(){
        //     groupChannel.sync(function(error,groupChannel){
        //       if(error == null){
        //         store.dispatch({
        //           type: GROUP_CHANNELS_GET_SUCCESS,
        //           groupChannel: groupChannel
        //         });
        //       }
        //     })
        //   }, 30000)
        // }
        // else if(isCurrentUserParticipant && !isCurrentUserAcceptedParticipant){
        //   store.dispatch({
        //     type: GROUP_CHANNELS_INVITE_ACCEPTANCE_REQUIRED,
        //     groupChannel: groupChannel
        //   });
        // }
        // else {
        //   store.dispatch({
        //     type: GROUP_CHANNELS_INVALID_PARTICIPANT,
        //     groupChannel: groupChannel
        //   });
        // }
      }
      else {
        // store.dispatch({
        //   type: OPEN_CHANNELS_GET_ERROR,
        //   error: error,
        //   groupChannelId: groupChannelId
        // });
      }
    });
  }


  return next => action => {
    next(action);
  }
}
