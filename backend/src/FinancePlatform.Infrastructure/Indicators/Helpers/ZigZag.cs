using System.Collections.Generic;

namespace FinancePlatform.Infrastructure.Indicators.Helpers
{
    public class ZigZag
    {
        private readonly List<int> _direction;
        private readonly List<int> _x;
        private readonly List<decimal> _y;
        private readonly List<bool> _boolean;
        private readonly int _maxSize;

        public int Count => _direction.Count;

        public ZigZag(int maxSize)
        {
            _direction = new List<int>();
            _x = new List<int>();
            _y = new List<decimal>();
            _boolean = new List<bool>();
            _maxSize = maxSize;
        }

        public int GetDirection(int index)
        {
            return index < _direction.Count ? _direction[index] : 0;
        }

        public int GetX(int index)
        {
            return index < _x.Count ? _x[index] : 0;
        }

        public decimal GetY(int index)
        {
            return index < _y.Count ? _y[index] : 0m;
        }

        public bool GetBoolean(int index)
        {
            return index < _boolean.Count ? _boolean[index] : false;
        }

        public void AddPoint(int dir, int x1, decimal y1, int x2, decimal y2, bool b)
        {
            _direction.Insert(0, dir);
            _x.Insert(0, x2);
            _y.Insert(0, y2);
            _boolean.Insert(0, b);

            if (_direction.Count > _maxSize)
            {
                _direction.RemoveAt(_direction.Count - 1);
                _x.RemoveAt(_x.Count - 1);
                _y.RemoveAt(_y.Count - 1);
                _boolean.RemoveAt(_boolean.Count - 1);
            }
        }

        public void UpdatePoint(int index, int x, decimal y)
        {
            if (index < _x.Count)
            {
                _x[index] = x;
                _y[index] = y;
            }
        }
    }
}
