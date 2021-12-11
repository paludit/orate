import React, { useState, useEffect } from "react";
import { database, auth } from "../utils/firebase";
import ChatMessages from "./ChatMessages";
import { v4 as uuidv4 } from "uuid";
import {
  ref,
  onValue,
  orderByChild,
  query,
  set,
  equalTo,
  onChildAdded,
  onDisconnect,
  push,
  onChildChanged,
} from "firebase/database";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

function App() {
  const [messages, setMessages] = useState([]);
  const [textMessage, setTextMessage] = useState("");
  const [user, setUser] = useState();
  const [receiver, setReceiver] = useState("");
  const [msgList, setMsgList] = useState([]);

  const provider = new GoogleAuthProvider();
  const signInwithGoogle = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        setUser(auth.currentUser);
        sessionStorage.setItem("useremail", auth.currentUser.email);
        sessionStorage.setItem("userUID", auth.currentUser.uid);
      })
      .catch((error) => {});
  };

  const logout = () => {
    set(
      ref(database, `users/${sessionStorage.getItem("userUID")}/onlineStatus`),
      false
    );
    sessionStorage.removeItem("userUID");
    sessionStorage.removeItem("useremail");
    signOut(auth)
      .then(() => {
        setUser(auth.currentUser);
      })
      .catch((error) => {});
  };

  function createMessage() {
    const timestamp = Date.now();
    push(ref(database, `messages`), {
      sender: sessionStorage.getItem("useremail"),
      receiver: receiver,
      timestamp: timestamp,
      textMessage: textMessage,
      stamp: `${sessionStorage.getItem("useremail")}_${receiver}`,
      delivered: false,
      seen: false,
    });
    setTextMessage("");
  }

  const checkingData = () => {
    setMessages([]);

    onChildAdded(
      query(
        ref(database, "messages"),
        orderByChild("stamp"),
        equalTo(`${sessionStorage.getItem("useremail")}_${receiver}`)
      ),
      (data) => {
        if (sessionStorage.getItem("useremail") === data.val().receiver) {
          set(ref(database, `messages/${data.key}/seen`), true);
        }
        if (
          receiver === data.val().receiver &&
          sessionStorage.getItem("useremail") === data.val().sender
        ) {
          setMessages((lastmsg) => [...lastmsg, data.val()]);
        }
      }
    );
    onChildAdded(
      query(
        ref(database, "messages"),
        orderByChild("stamp"),
        equalTo(`${receiver}_${sessionStorage.getItem("useremail")}`)
      ),
      (data) => {
        if (
          sessionStorage.getItem("useremail") === data.val().receiver &&
          receiver === data.val().sender
        ) {
          set(ref(database, `messages/${data.key}/seen`), true);
        }
        if (
          receiver === data.val().sender &&
          sessionStorage.getItem("useremail") === data.val().receiver
        ) {
          setMessages((lastmsg) => [...lastmsg, data.val()]);
        }
      }
    );
  };

  const checkingData2 = () => {
    onValue(
      query(
        ref(database, "messages"),
        orderByChild("receiver"),
        equalTo(`${sessionStorage.getItem("useremail")}`)
      ),
      (snapshot) => {
        const data = snapshot.val();
        for (let id in data) {
          set(ref(database, `messages/${id}/delivered`), true);
        }
      }
    );
    onChildChanged(
      query(
        ref(database, "messages"),
        orderByChild("stamp"),
        equalTo(`${sessionStorage.getItem("useremail")}_${receiver}`)
      ),
      (data) => {
        setMessages(
          messages.map((item) =>
            item.timestamp === data.val().timestamp
              ? {
                  ...item,
                  seen: data.val().seen,
                  delivered: data.val().delivered,
                }
              : item
          )
        );
      }
    );
  };

  useEffect(() => {
    checkingData();
  }, [receiver]);

  useEffect(() => {
    checkingData2();
  }, [checkingData2]);

  useEffect(() => {
    const msgRef = ref(database, "users");
    onValue(msgRef, (snapshot) => {
      const data = snapshot.val();
      const msgList = [];
      for (let id in data) {
        if (data[id].email) {
          msgList.push(data[id]);
        }
      }
      setMsgList(msgList);
    });

    if (user) {
      set(ref(database, `users/${user.uid}`), {
        email: user.email,
        name: user.displayName,
      });
    }
    if (sessionStorage.getItem("userUID")) {
      set(
        ref(
          database,
          `users/${sessionStorage.getItem("userUID")}/onlineStatus`
        ),
        true
      );
    }
  }, [user]);

  onDisconnect(
    ref(database, `users/${sessionStorage.getItem("userUID")}/onlineStatus`)
  ).set(false);

  return (
    <div>
      {user ? (
        <div className="grid grid-cols-10 h-screen fixed w-full">
          <div className="col-span-3 bg-red-200 overflow-auto">
            {msgList
              ? msgList
                  .filter((msg) => {
                    return msg.email !== user.email;
                  })
                  .map((msg) => {
                    return (
                      <div
                        key={uuidv4()}
                        className={`text-center my-1 py-3 mx-1 px-3 border-4 rounded-lg bg-blue-100 hover:bg-blue-200${
                          msg.onlineStatus ? " text-green-600" : " text-black"
                        }`}
                      >
                        <button
                          onClick={() => {
                            setReceiver(msg.email);
                          }}
                          className="h-full w-full"
                        >
                          <h1 className="font-semibold">{msg.name}</h1>
                        </button>
                      </div>
                    );
                  })
              : null}
          </div>
          <div className="col-span-7 bg-gray-100 overflow-auto mb-12">
            <div className="h-screen bg-gray-100 p-8">
              <div className="max-w-4xl mx-auto space-y-12 grid grid-cols-1 pb-10">
                {messages
                  .sort(function (x, y) {
                    return x.timestamp - y.timestamp;
                  })
                  .map((message) => {
                    return (
                      <ChatMessages
                        key={uuidv4()}
                        msgtext={message.textMessage}
                        useremail={user.email}
                        senderemail={message.sender}
                        seen={message.seen}
                        delivered={message.delivered}
                      />
                    );
                  })}
              </div>
            </div>
          </div>
          <div className="flex w-3/5 h-12 absolute bottom-0 right-0">
            <input
              className="inline border-4 w-4/5"
              type="text"
              onChange={(e) => {
                setTextMessage(e.target.value);
              }}
              value={textMessage}
            />
            <button
              className="rounded px-3 py-2 m-1 border-b-4 border-l-2 shadow-lg bg-green-800 border-green-900 text-white inline-block"
              onClick={createMessage}
            >
              Send
            </button>
            <button
              className="rounded px-3 py-2 m-1 border-b-4 border-l-2 shadow-lg bg-red-800 border-red-900 text-white"
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-screen">
          <div className="m-auto">
            <button
              className="rounded px-3 py-2 m-1 border-b-4 border-l-2 shadow-lg bg-red-800 border-red-900 text-white"
              onClick={signInwithGoogle}
            >
              Sign in With Google
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
