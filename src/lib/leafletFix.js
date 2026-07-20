import L from 'leaflet'

/**
 * Defensive Patch for Leaflet in React single-page applications.
 * Fixes:
 * 1. "TypeError: Cannot read properties of undefined (reading '_leaflet_pos')"
 * 2. Method chaining breakages (`_move`, `_moveStart`, `_moveEnd`) when map panes are unmounted.
 */

if (typeof L !== 'undefined') {
  // 1. Guard DomUtil.getPosition against null/undefined elements
  if (L.DomUtil && typeof L.DomUtil.getPosition === 'function') {
    const originalGetPosition = L.DomUtil.getPosition
    L.DomUtil.getPosition = function (el) {
      if (!el) return new L.Point(0, 0)
      return originalGetPosition(el)
    }
  }

  // 2. Guard Map prototype methods against destroyed map panes while maintaining method chaining
  if (L.Map && L.Map.prototype) {
    // Guard _getMapPanePos
    if (typeof L.Map.prototype._getMapPanePos === 'function') {
      const originalGetMapPanePos = L.Map.prototype._getMapPanePos
      L.Map.prototype._getMapPanePos = function (...args) {
        if (!this._mapPane) return new L.Point(0, 0)
        try {
          return originalGetMapPanePos.apply(this, args)
        } catch (err) {
          return new L.Point(0, 0)
        }
      }
    }

    // Guard _onZoomTransitionEnd
    if (typeof L.Map.prototype._onZoomTransitionEnd === 'function') {
      const originalOnZoomTransitionEnd = L.Map.prototype._onZoomTransitionEnd
      L.Map.prototype._onZoomTransitionEnd = function (...args) {
        if (!this._mapPane || !this._container) {
          this._animatingZoom = false
          return this
        }
        try {
          originalOnZoomTransitionEnd.apply(this, args)
        } catch (err) {
          console.warn('Prevented Leaflet zoom transition error on unmounted map:', err)
          this._animatingZoom = false
        }
        return this
      }
    }

    // Guard _move (CRITICAL: Must return `this` for Leaflet method chaining)
    if (typeof L.Map.prototype._move === 'function') {
      const originalMove = L.Map.prototype._move
      L.Map.prototype._move = function (...args) {
        if (!this._mapPane || !this._container) return this
        try {
          const res = originalMove.apply(this, args)
          return res !== undefined ? res : this
        } catch (err) {
          console.warn('Prevented Leaflet _move error on unmounted map:', err)
          return this
        }
      }
    }

    // Guard _moveStart (CRITICAL: Must return `this` for Leaflet method chaining)
    if (typeof L.Map.prototype._moveStart === 'function') {
      const originalMoveStart = L.Map.prototype._moveStart
      L.Map.prototype._moveStart = function (...args) {
        if (!this._mapPane || !this._container) return this
        try {
          const res = originalMoveStart.apply(this, args)
          return res !== undefined ? res : this
        } catch (err) {
          return this
        }
      }
    }

    // Guard _moveEnd (CRITICAL: Must return `this` for Leaflet method chaining)
    if (typeof L.Map.prototype._moveEnd === 'function') {
      const originalMoveEnd = L.Map.prototype._moveEnd
      L.Map.prototype._moveEnd = function (...args) {
        if (!this._mapPane || !this._container) return this
        try {
          const res = originalMoveEnd.apply(this, args)
          return res !== undefined ? res : this
        } catch (err) {
          return this
        }
      }
    }
  }
}

export default L
