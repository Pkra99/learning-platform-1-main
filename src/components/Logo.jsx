import React from 'react'

function Logo({width = '100px'}) {
  return (
    <div>
      <img
        alt="Your Company"
        src="https://api.logo.com/api/v2/images?logo=lg_zxJw0WiVnCmCnjmK7U&format=webp&width=2000&background=transparent&fit=contain&quality=100&u=2024-11-01T05%3A08%3A40.582Z"
        className="sm:mx-auto sm:w-full sm:max-w-sm"
      />
    </div>
  );
}

export default Logo