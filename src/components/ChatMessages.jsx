import React, { useEffect } from "react";
import { TiTick } from "react-icons/ti";

function ChatMessages(props) {
  useEffect(() => {}, [props]);

  return (
    <div
      className={
        props.senderemail !== props.useremail
          ? "place-self-start text-left"
          : "place-self-end text-right"
      }
    >
      <div
        className={
          props.senderemail !== props.useremail
            ? "bg-white p-5 rounded-2xl rounded-tl-none"
            : "bg-green-50 text-green-900 p-5 rounded-2xl rounded-tr-none"
        }
      >
        {props.msgtext}
      </div>
      {props.seen && props.senderemail === props.useremail ? (
        <h1 className="float-right">
          <TiTick className="text-green-500 inline" />
          <TiTick className="text-green-500 inline" />
        </h1>
      ) : null}
      {props.delivered &&
      !props.seen &&
      props.senderemail === props.useremail ? (
        <h1 className="float-right">
          <TiTick className="text-gray-700 inline" />
          <TiTick className="text-gray-700 inline" />
        </h1>
      ) : null}
      {!props.seen &&
      !props.delivered &&
      props.senderemail === props.useremail ? (
        <h1 className="float-right">
          <TiTick className="text-gray-700" />
        </h1>
      ) : null}
    </div>
  );
}

export default ChatMessages;
