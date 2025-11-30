const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#000', '#FFF'];

const ColorPicker = ({ selectedColor, onColorChange, handleClear }) => (
  <div className='flex items-center gap-2 my-2'>
    <label className='text-sm font-medium mr-2'>Draw Polygon:</label>
    {COLORS.map((color) => (
      <button
        key={color}
        className={`w-6 h-6 rounded-full border-2 ${selectedColor === color ? 'border-blue-700' : 'border-gray-300'}`}
        style={{ background: color }}
        onClick={() => onColorChange(color)}
        aria-label={`Select color ${color}`}
        type='button'
      />
    ))}
    <button
      type='button'
      className='ml-3 text-xs px-2 py-1 bg-gray-200 rounded hover:bg-red-400 hover:text-white transition'
      onClick={handleClear}
      title='Clear'>
      ✕
    </button>
  </div>
);

export default ColorPicker;
