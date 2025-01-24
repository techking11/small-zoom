import styled from 'styled-components';

export const Video = styled.video`
  height: 20rem;
  margin: 2rem;
`;

export const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
`;

export const CallerContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const CallButton = styled.button`
  margin: 1rem;
  padding: 0.8rem;
  border-radius: 2rem;
  border-width: 0rem;
  &:hover {
    background-color: gray;
  }
  &:focus {
    outline: none;
  }
`;

export const RecievingCallButton = styled.button`
  margin: 1rem;
  padding: 0.8rem;
  border-radius: 2rem;
  border-width: 0rem;
  color: white;
  background-color: darkolivegreen;
  &:hover {
    background-color: green;
  }
  &:focus {
    outline: none;
  }
`;

export const VideoContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const BlankContainer = styled.div`
  background-color: gray;
  height: 20rem;
  width: 28rem;
  margin: 2rem;
`;
