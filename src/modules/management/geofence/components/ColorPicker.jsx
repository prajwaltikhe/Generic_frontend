const ColorPicker = ({ selectedColor, onColorChange, handleClear }) => (
  <div>
    <span>Draw Polygon:</span>
    <div style={{ display: 'flex', margin: '10px 0' }}>
      {['#FF0000', '#00FF00', '#0000FF', '#000000', '#FFFFFF'].map((color) => (
        <div
          key={color}
          onClick={() => onColorChange(color)}
          style={{
            backgroundColor: color,
            width: 20,
            height: 20,
            margin: '0 5px',
            cursor: 'pointer',
            border: selectedColor === color ? '2px solid black' : 'none',
          }}
        />
      ))}
    </div>
    <button
      type='button'
      className='text-white bg-blue-500 hover:bg-blue-500 font-medium rounded-sm text-sm px-5 py-2.5 cursor-pointer'
      onClick={handleClear}>
      Delete selected shape
    </button>
  </div>
);

export default ColorPicker;
