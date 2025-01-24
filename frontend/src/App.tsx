import React, { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import {
  Video,
  Container,
  CallerContainer,
  CallButton,
  RecievingCallButton,
  VideoContainer,
  BlankContainer,
} from './StyledComponents';

interface User {
  id: string;
}

const App: React.FC = () => {
  const [stream, setStream] = useState<MediaStream | undefined>();
  const [myID, setMyID] = useState<string | undefined>();
  const [onlineUsers, setOnlineUsersList] = useState<{ [key: string]: User }>(
    {}
  );
  const [callerId, setCallerId] = useState<string>('');
  const [receivingCall, setReceivingCall] = useState<boolean>(false);
  const [callerSignal, setCallerSignal] = useState<any>(undefined);
  const [callAccepted, setCallAccepted] = useState<boolean>(false);
  const [rtcConnection, setRtcConnection] = useState<RTCPeerConnection | null>(
    null
  );

  const socket = useRef<Socket | undefined>();
  const userVideo = useRef<HTMLVideoElement | null>(null);
  const partnerVideo = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    socket.current = io('http://localhost:5000');

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
      });

    socket.current.on('id_report', (id: string) => {
      setMyID(id);
    });

    socket.current.on(
      'online_users_report',
      (users: { [key: string]: User }) => {
        setOnlineUsersList(users);
      }
    );

    socket.current.on(
      'someone_calling',
      (data: { from: string; signal: any }) => {
        setReceivingCall(true);
        setCallerId(data.from);
        setCallerSignal(data.signal);
      }
    );

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  const createPeerConnection = () => {
    const config = {
      iceServers: [
        {
          urls: 'stun:stun.l.google.com:19302',
        },
      ],
    };
    const peerConnection = new RTCPeerConnection(config);

    if (stream) {
      // Add the video/audio tracks to the peer connection
      stream
        .getTracks()
        .forEach((track) => peerConnection.addTrack(track, stream));
    }

    peerConnection.ontrack = (event) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = event.streams[0]; // Attach the remote stream
      }
    };

    return peerConnection;
  };

  const callPeer = async (id: string) => {
    const peerConnection = createPeerConnection();
    setRtcConnection(peerConnection);

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.current?.emit('call_someone', {
      callId: id,
      signal: offer,
      callerId: myID,
    });

    socket.current?.on('call_accepted', async (signal: any) => {
      setCallAccepted(true);
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(signal)
      );
    });

    socket.current?.on('candidate', (candidate: any) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };

  const acceptCall = async () => {
    setCallAccepted(true);
    setReceivingCall(false); // Set receiving call to false to hide the incoming call prompt
    const peerConnection = createPeerConnection();
    setRtcConnection(peerConnection);

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(callerSignal)
    );
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.current?.emit('accept_calling', {
      signal: answer,
      to: callerId,
    });

    socket.current?.on('candidate', (candidate: any) => {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    });
  };

  const hangUp = () => {
    if (partnerVideo.current) {
      partnerVideo.current.srcObject = null;
    }
    setCallerId('');
    setReceivingCall(false);
    setCallerSignal(undefined);
    setCallAccepted(false);
    rtcConnection?.close();
    setRtcConnection(null);
  };

  const UserVideo = stream ? (
    <Video playsInline ref={userVideo} autoPlay />
  ) : null;

  const PartnerVideo = callAccepted ? (
    <Video playsInline ref={partnerVideo} autoPlay />
  ) : (
    <BlankContainer />
  );

  const incomingCall = receivingCall ? (
    <>
      <p>{callerId} is calling you</p>
      <RecievingCallButton onClick={acceptCall}>Accept</RecievingCallButton>
    </>
  ) : null;

  return (
    <Container>
      <h1>Video Chat!</h1>
      <VideoContainer>
        {UserVideo}
        {PartnerVideo}
      </VideoContainer>

      <CallerContainer>
        {Object.values(onlineUsers).map((user) => {
          if (user.id !== myID) {
            return (
              <CallButton key={user.id} onClick={() => callPeer(user.id)}>
                {`Call ${user.id}`}
              </CallButton>
            );
          }
        })}
      </CallerContainer>

      {incomingCall}

      <CallButton onClick={hangUp}>Hang Up</CallButton>
    </Container>
  );
};

export default App;
