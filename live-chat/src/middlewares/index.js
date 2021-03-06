import client from 'Client'
import uuidv4 from 'uuid/v4'
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
  GROUP_CHANNELS_HIDE
} from 'state/action-types'

import Utility from 'utility/Utility'

export const iFlyMiddleWare = store => {
  // let userId;
  // if(window.ChatCampData && window.ChatCampData.userId){
  //   userId = window.ChatCampData.userId
  // }
  // if(Utility.getUrlQueryParams(window.location.href)['userId'] && Utility.getUrlQueryParams(window.location.href)['userId'][0]) {
  //   userId = Utility.getUrlQueryParams(window.location.href)['userId'][0]
  // }
  let userArray
  let userObject = {};
  for ( let i in localStorage) {
    let jsonArray = localStorage.getItem( localStorage.key( i ))
    if(jsonArray && jsonArray !== 'null' && jsonArray !== 'undefined'){
      console.log(typeof(jsonArray))
      let a =  (JSON.parse(jsonArray)).user
      if(typeof(a) !== 'undefined'){
        userArray = (JSON.parse(a))
        userArray = (JSON.parse(userArray))[1]
        for (let i in userArray){
          if(i % 2 === 0 ){
            let first = Number(i)
            let second = first + 1
            userObject[userArray[first]] = userArray[second];
          }
        }
      }
    }

  }

  let userId;
  if(typeof(userObject["id"]) !== 'undefined'){
    userId = userObject["id"]
  }
  else{
    userId = uuidv4()
  }

  // to expose startchat to other platforms
  let startChat = (groupChannelId) => {
    _startGroupChannel(groupChannelId)
    store.dispatch({
      type: GROUP_CHANNELS_OPEN,
      groupChannelsId: groupChannelId
    })
  }

  // client.connect(userId, accessToken, "localhost", "9080", function(e, user) {
  client.connect(userId, "localhost", "9080", function(e, user) {
  // client.connect(userId, function(e, user) {
  // client.connect(userId, function(e, user) {
    if(e==null) {
      // client.updateUserDisplayName(userId, "ws://192.168.2.145", "9080", function(e, user) {
      window.ChatCampUI = {}
        window.ChatCampUI.startChat = startChat
        let groupChannelId1
        var allGroupChannels = []
        if(Utility.getUrlQueryParams(window.location.href)['groupChannelId'] && Utility.getUrlQueryParams(window.location.href)['groupChannelId'][0]) {
          groupChannelId1 = Utility.getUrlQueryParams(window.location.href)['groupChannelId'][0]
          allGroupChannels[0] = groupChannelId1
        }

        user["appId"] = client.app.id
        let storeChannels = store.getState().groupChannelsState.keySeq().toArray()
         // storeChannels = []
        allGroupChannels = allGroupChannels.concat(storeChannels)

        store.dispatch({
          type: CHAT_CONNECT_SUCCESS,
          user: user
        });
        store.dispatch({
          type: SET_SMART_CHAT_TYPE,
          data: {type: "popup"} //popup or embed
        });

      // for(let i in allGroupChannels){
      //   let groupChannelId = allGroupChannels[i]
      //   // _startGroupChannel(groupChannelId)
      //   client.GroupChannel.get(groupChannelId, function(error, groupChannel) {
      //     if(!error) {
      //       store.dispatch({
      //         type: GROUP_CHANNELS_GET_SUCCESS,
      //         groupChannel: groupChannel
      //       });
      //       store.dispatch({
      //         type: GROUP_CHANNELS_HIDDEN,
      //         groupChannelsId: groupChannel.id
      //       })
      //     }
      //   });
      // }

        let channelListener = new client.ChannelListener();
        channelListener.onGroupChannelMessageReceived = function(groupChannel, message) {
          console.log("Listener", groupChannel, message)
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
          if(state !== "OPEN" && store.getState().smartChat.getIn(["type"]) === "popup"){
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
              store.dispatch({
                type: GROUP_CHANNELS_OPEN,
                groupChannelsId: groupChannel.id
              })
            }

          }
          store.dispatch({
            type: GROUP_CHANNELS_MESSAGE_RECEIVED_SUCCESS,
            groupChannel: groupChannel,
            message: message
          });
        }

        channelListener.onGroupChannelTypingStatusChanged = function(groupChannel) {
          console.log("Typing Status", groupChannel, groupChannel.getTypingParticipants())
          store.dispatch({
            type: GROUP_CHANNELS_GET_SUCCESS,
            groupChannel: groupChannel
          });
        }

        channelListener.onGroupChannelReadStatusUpdated = function(groupChannel) {
          console.log("Read Status Update", groupChannel)
          store.dispatch({
            type: GROUP_CHANNELS_GET_SUCCESS,
            groupChannel: groupChannel
          });
        }

        client.addChannelListener("t", channelListener)
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
          let previousMessageListQuery = groupChannel.createPreviousMessageListQuery();
          previousMessageListQuery.load(20, null, function(previousMessageListQueryError, messages) {
            store.dispatch({
              type: GROUP_CHANNELS_GET_HISTORY_SUCCESS,
              groupChannel: groupChannel,
              messages: messages
            });
          })

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
    // let channelListener = new client.ChannelListener();
    // channelListener.onGroupChannelMessageReceived = function(groupChannel, message) {
    //   console.log("Listener", groupChannel, message)
    //   store.dispatch({
    //     type: GROUP_CHANNELS_MESSAGE_RECEIVED_SUCCESS,
    //     groupChannel: groupChannel,
    //     message: message
    //   });
    // }
    // client.addChannelListener("t1", channelListener)
  }


  return next => action => {
    next(action);
  }
}
