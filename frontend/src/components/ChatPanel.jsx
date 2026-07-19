import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function ChatPanel({ user, contacts }) {
  const { socket } = useAuth();
  const [groups, setGroups] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // { type: 'direct'|'group', id, name }
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    api.listGroups().then(setGroups);
  }, []);

  useEffect(() => {
    const s = socket.current;
    if (!s) return;

    function onDirect(msg) {
      if (
        activeChat?.type === "direct" &&
        (msg.sender_id === activeChat.id || msg.receiver_id === activeChat.id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    }
    function onGroup(msg) {
      if (activeChat?.type === "group" && msg.group_id === activeChat.id) {
        setMessages((prev) => [...prev, msg]);
      }
    }
    s.on("new_direct_message", onDirect);
    s.on("new_group_message", onGroup);
    return () => {
      s.off("new_direct_message", onDirect);
      s.off("new_group_message", onGroup);
    };
  }, [socket, activeChat]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function openDirect(contact) {
    setActiveChat({ type: "direct", id: contact.id, name: contact.full_name });
    const history = await api.directHistory(contact.id);
    setMessages(history);
  }

  async function openGroup(group) {
    setActiveChat({ type: "group", id: group.id, name: group.group_name });
    socket.current?.emit("join_group", group.id);
    const history = await api.groupHistory(group.id);
    setMessages(history);
  }

  function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim() || !activeChat) return;
    if (activeChat.type === "direct") {
      socket.current.emit("send_direct", { receiver_id: activeChat.id, body: draft });
    } else {
      socket.current.emit("send_group", { group_id: activeChat.id, body: draft });
    }
    setDraft("");
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    const group = await api.createGroup({ group_name: groupName, member_ids: groupMembers.map(Number) });
    setGroups((g) => [...g, group]);
    setShowGroupForm(false);
    setGroupName("");
    setGroupMembers([]);
  }

  return (
    <div className="row g-3">
      <div className="col-md-3">
        <h6 className="text-muted small text-uppercase">Direct Messages</h6>
        <ul className="list-group mb-3">
          {contacts.map((c) => (
            <li
              key={c.id}
              className={`list-group-item list-group-item-action ${
                activeChat?.type === "direct" && activeChat.id === c.id ? "active" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => openDirect(c)}
            >
              {c.full_name}
            </li>
          ))}
        </ul>

        <div className="d-flex justify-content-between align-items-center">
          <h6 className="text-muted small text-uppercase mb-0">Groups</h6>
          <button className="btn btn-sm btn-link p-0" onClick={() => setShowGroupForm((s) => !s)}>
            + New
          </button>
        </div>
        {showGroupForm && (
          <form onSubmit={handleCreateGroup} className="card p-2 my-2">
            <input
              className="form-control form-control-sm mb-2"
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />
            <select
              multiple
              className="form-select form-select-sm mb-2"
              value={groupMembers}
              onChange={(e) => setGroupMembers(Array.from(e.target.selectedOptions, (o) => o.value))}
            >
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
            <button className="btn btn-sm btn-success">Create</button>
          </form>
        )}
        <ul className="list-group">
          {groups.map((g) => (
            <li
              key={g.id}
              className={`list-group-item list-group-item-action ${
                activeChat?.type === "group" && activeChat.id === g.id ? "active" : ""
              }`}
              style={{ cursor: "pointer" }}
              onClick={() => openGroup(g)}
            >
              # {g.group_name}
            </li>
          ))}
        </ul>
      </div>

      <div className="col-md-9">
        {!activeChat ? (
          <div className="text-muted">Select a contact or group to start messaging.</div>
        ) : (
          <>
            <h6>{activeChat.type === "group" ? `# ${activeChat.name}` : activeChat.name}</h6>
            <div className="chat-window mb-2" ref={scrollRef}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`msg-bubble ${m.sender_id === user.id ? "msg-mine" : "msg-theirs"}`}
                >
                  {m.body}
                </div>
              ))}
              {messages.length === 0 && <div className="text-muted small">No messages yet. Say hi!</div>}
            </div>
            <form onSubmit={sendMessage} className="d-flex gap-2">
              <input
                className="form-control"
                placeholder="Type a message..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="btn btn-primary">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
