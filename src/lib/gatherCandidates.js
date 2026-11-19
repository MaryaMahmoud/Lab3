// Plain JavaScript helper (no React).
// Creates a peer connection, starts ICE gathering, and reports candidates.
export function gatherCandidates({ iceServers, onCandidate, onDone, onStateChange }) {
  const pc = new RTCPeerConnection({ iceServers });
  pc.createDataChannel("probe");

  pc.onicegatheringstatechange = () => onStateChange?.(pc.iceGatheringState);

  pc.onicecandidate = (e) => {
    if (e.candidate) onCandidate(e.candidate);
    else onDone(); // null candidate = gathering finished
  };

  pc.createOffer()
    .then((offer) => pc.setLocalDescription(offer))
    .catch(console.error);

  // cleanup handle for React
  return () => pc.close();
}
