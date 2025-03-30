import React from 'react';
import Confetti from 'react-confetti';

const ConfettiComponent = ({ width, height, isCelebrating }) => {
  return (
    <div>
      {/* Conditionally render the confetti when isCelebrating is true */}
      {isCelebrating && <Confetti width={width} height={height} />}
    </div>
  );
};

export default ConfettiComponent;
