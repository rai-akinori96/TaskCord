import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io("http://localhost:5000");

function App() {
  const [role, setRole] = useState(null);
  const [name, setName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [replyMsg, setReplyMsg] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const jobInfo = {
    title: "Senior ReactJS Developer (Remote)",
    company: "TechCorp Global",
    salary: "$2,000 - $3,500 / tháng",
    timezone: "GMT+7 / GMT+8",
    type: "Full-time Remote"
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.zalo-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    socket.on('load_history', (history) => setMessages(history));
    socket.on('load_pinned', (pinned) => setPinnedMessage(pinned));
    socket.on('receive_message', (message) => setMessages((prev) => [...prev, message]));

    socket.on('message_revoked', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRevoked: true, text: '', imageData: null } : msg
        )
      );
    });

    socket.on('message_pinned', (pinned) => setPinnedMessage(pinned));

    return () => {
      socket.off('load_history');
      socket.off('load_pinned');
      socket.off('receive_message');
      socket.off('message_revoked');
      socket.off('message_pinned');
    };
  }, []);

  const handleLogin = (selectedRole) => {
    if (!name.trim()) return alert('Vui lòng nhập tên!');
    setRole(selectedRole);
    setIsLoggedIn(true);
    socket.emit('join_conversation', { userName: name.trim(), userRole: selectedRole });
  };

  const sendMessage = () => {
    if (text.trim()) {
      socket.emit('send_message', { text, replyTo: replyMsg });
      setText('');
      setReplyMsg(null);
    }
  };

  const sendImageBase64 = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      socket.emit('send_message', { imageData: e.target.result, replyTo: replyMsg });
      setReplyMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) sendImageBase64(file);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        sendImageBase64(items[i].getAsFile());
        e.preventDefault();
      }
    }
  };

  const handleCopy = (msg) => {
    const content = msg.text || '[Hình ảnh]';
    navigator.clipboard.writeText(content);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 1500);
    setActiveMenuId(null);
  };

  const handlePin = (msg) => {
    socket.emit('pin_message', { message: msg });
    setActiveMenuId(null);
  };

  const handleRevoke = (messageId) => {
    socket.emit('revoke_message', { messageId });
    setActiveMenuId(null);
  };

  const handleDeleteLocal = (messageId) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    setActiveMenuId(null);
  };

  if (!isLoggedIn) {
    return (
      <div style={{ padding: 40, maxWidth: 400, margin: '50px auto', textAlign: 'center', border: '1px solid #ddd', borderRadius: 8 }}>
        <h2 style={{ color: '#0068ff' }}>RemoteConnect</h2>
        <input 
          style={{ width: '90%', padding: 10, marginBottom: 15, borderRadius: 4, border: '1px solid #ccc' }} 
          placeholder="Nhập họ tên..." 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button style={{ padding: '10px 15px', background: '#0068ff', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }} onClick={() => handleLogin('candidate')}>Ứng viên</button>
          <button style={{ padding: '10px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }} onClick={() => handleLogin('employer')}>Nhà tuyển dụng</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: '20px auto', fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 20px', background: '#f5f6f7', borderRadius: 8, marginBottom: 15, border: '1px solid #e0e0e0' }}>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>RemoteConnect Chat</div>
        <div>Xin chào: <strong>{name}</strong> ({role === 'candidate' ? 'Ứng viên' : 'NTD'})</div>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Thông tin công việc */}
        <div style={{ width: 280, border: '1px solid #e0e0e0', padding: 15, borderRadius: 8, background: '#fafafa', height: 'fit-content' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#0068ff' }}>{jobInfo.title}</h4>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{jobInfo.company}</p>
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />
          <p style={{ fontSize: 13, margin: '4px 0' }}><b>Lương:</b> {jobInfo.salary}</p>
          <p style={{ fontSize: 13, margin: '4px 0' }}><b>Múi giờ:</b> {jobInfo.timezone}</p>
        </div>

        {/* Khung Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Thanh Ghim */}
          {pinnedMessage && (
            <div style={{ background: '#e5efff', border: '1px solid #cbe0ff', padding: '8px 12px', borderRadius: '6px 6px 0 0', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>📌 <b>Đã ghim:</b> {pinnedMessage.senderName}: {pinnedMessage.text || '[Hình ảnh]'}</div>
              <span style={{ cursor: 'pointer', color: '#888' }} onClick={() => socket.emit('pin_message', { message: null })}>✕</span>
            </div>
          )}

          {/* Danh sách tin nhắn */}
          <div style={{ border: '1px solid #e0e0e0', height: 380, overflowY: 'scroll', padding: 15, background: '#ebedf0', borderRadius: pinnedMessage ? '0 0 8px 8px' : 8 }}>
            {messages.map((msg) => {
              const isMe = msg.senderName === name;
              const isMenuOpen = activeMenuId === msg.id;

              return (
                <div key={msg.id} style={{ textAlign: isMe ? 'right' : 'left', marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: '#65676b', marginBottom: 3 }}>
                    {msg.senderName} • {msg.createdAt}
                  </div>

                  <div className="zalo-menu-container" style={{ display: 'inline-flex', alignItems: 'center', flexDirection: isMe ? 'row-reverse' : 'row', position: 'relative' }}>
                    {/* Content */}
                    <div style={{
                      padding: msg.imageData ? '4px' : '9px 13px',
                      borderRadius: 12,
                      background: msg.isRevoked ? '#e4e6eb' : (isMe ? '#e5efff' : '#ffffff'),
                      color: msg.isRevoked ? '#65676b' : '#050505',
                      border: msg.isRevoked ? 'none' : '1px solid #e0e0e0',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      maxWidth: 320,
                      textAlign: 'left',
                      fontStyle: msg.isRevoked ? 'italic' : 'normal'
                    }}>
                      {msg.replyTo && (
                        <div style={{ borderLeft: '3px solid #0068ff', paddingLeft: 8, marginBottom: 6, color: '#65676b', fontSize: 12 }}>
                          <b>{msg.replyTo.senderName}:</b> {msg.replyTo.text || '[Hình ảnh]'}
                        </div>
                      )}

                      {msg.isRevoked ? (
                        "Tin nhắn đã được thu hồi"
                      ) : (
                        <>
                          {msg.text && <div style={{ fontSize: 14, lineHeight: '1.4' }}>{msg.text}</div>}
                          {msg.imageData && (
                            <a href={msg.imageData} target="_blank" rel="noopener noreferrer">
                              <img src={msg.imageData} alt="img" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginTop: 4 }} />
                            </a>
                          )}
                        </>
                      )}
                    </div>

                    {/* Quick options */}
                    {!msg.isRevoked && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', margin: '0 6px', gap: 4 }}>
                        <button onClick={() => setReplyMsg(msg)} title="Trích dẫn" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#65676b', fontSize: 14 }}>💬</button>
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : msg.id); }} title="Thêm" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#65676b', fontSize: 14, fontWeight: 'bold' }}>•••</button>
                      </div>
                    )}

                    {/* Zalo Popup Context Menu */}
                    {isMenuOpen && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        [isMe ? 'right' : 'left']: 0,
                        zIndex: 200,
                        background: '#ffffff',
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        width: 180,
                        padding: '6px 0',
                        marginTop: 4
                      }}>
                        {!msg.isRevoked && (
                          <>
                            <div onClick={() => handleCopy(msg)} style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#050505', display: 'flex', gap: '10px' }}>
                              📋 {copiedId === msg.id ? 'Đã copy!' : 'Copy tin nhắn'}
                            </div>
                            <div onClick={() => handlePin(msg)} style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#050505', display: 'flex', gap: '10px' }}>
                              📌 Ghim tin nhắn
                            </div>
                            <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />
                          </>
                        )}

                        {isMe && !msg.isRevoked && (
                          <div onClick={() => handleRevoke(msg.id)} style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#e41e3f', display: 'flex', gap: '10px' }}>
                            🔄 Thu hồi
                          </div>
                        )}

                        <div onClick={() => handleDeleteLocal(msg.id)} style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: '#e41e3f', display: 'flex', gap: '10px' }}>
                          🗑️ Xóa chỉ ở phía tôi
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ô nhập tin nhắn */}
          <div style={{ marginTop: 10, border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff', padding: 8 }}>
            {replyMsg && (
              <div style={{ background: '#f0f2f5', padding: '6px 10px', borderRadius: 6, marginBottom: 8, fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                <div>Đang trả lời <b>{replyMsg.senderName}</b>: <i>{replyMsg.text || '[Hình ảnh]'}</i></div>
                <span style={{ cursor: 'pointer' }} onClick={() => setReplyMsg(null)}>✕</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <label style={{ cursor: 'pointer', fontSize: 18, padding: '0 6px' }} title="Gửi ảnh">
                🖼️
                <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <input 
                style={{ flex: 1, padding: '8px 12px', border: 'none', outline: 'none', fontSize: 14 }}
                value={text} 
                onChange={(e) => setText(e.target.value)} 
                onPaste={handlePaste}
                placeholder="Nhập tin nhắn hoặc ấn Ctrl + V để dán ảnh..." 
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button style={{ padding: '8px 16px', background: '#0068ff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }} onClick={sendMessage}>Gửi</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;