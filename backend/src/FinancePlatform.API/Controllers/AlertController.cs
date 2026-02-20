using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FinancePlatform.API.Auth;
using FinancePlatform.Domain.Models;
using FinancePlatform.API.Services;

namespace FinancePlatform.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AlertController : ControllerBase
    {
        private readonly AlertRepository _repo;
        private readonly AlertBackgroundService _alertService;

        public AlertController(AlertRepository repo, AlertBackgroundService alertService)
        {
            _repo = repo;
            _alertService = alertService;
        }


        [HttpGet]
        public async Task<IActionResult> GetAlerts(CancellationToken ct)
        {
            var userId = AuthService.GetUserId(User);
            var alerts = await _repo.GetAlertsAsync(userId, ct);
            return Ok(alerts);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAlert([FromBody] CreateAlertRequest request, CancellationToken ct)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Symbol) || string.IsNullOrWhiteSpace(request.AlertType))
                return BadRequest(new { error = "Symbol and alertType are required." });

            if (request.AlertType is "price_above" or "price_below" && request.TargetPrice == null)
                return BadRequest(new { error = "TargetPrice is required for price alerts." });

            if (request.AlertType == "indicator_signal" && string.IsNullOrWhiteSpace(request.IndicatorType))
                return BadRequest(new { error = "IndicatorType is required for indicator alerts." });

            var userId = AuthService.GetUserId(User);
            var id = await _repo.CreateAlertAsync(userId, request, ct);

            _ = Task.Run(() => _alertService.TriggerImmediateAnalysisAsync(default), CancellationToken.None);

            return Ok(new { id });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAlert(Guid id, CancellationToken ct)
        {
            var userId = AuthService.GetUserId(User);
            await _repo.DeleteAlertAsync(userId, id, ct);
            return Ok(new { deleted = true });
        }

        [HttpGet("triggered")]
        public async Task<IActionResult> GetTriggeredAlerts(CancellationToken ct)
        {
            var userId = AuthService.GetUserId(User);
            var alerts = await _repo.GetTriggeredAlertsAsync(userId, ct);
            return Ok(alerts);
        }

        [HttpPost("{id}/dismiss")]
        public async Task<IActionResult> DismissAlert(Guid id, CancellationToken ct)
        {
            var userId = AuthService.GetUserId(User);
            await _repo.DismissAlertAsync(userId, id, ct);
            return Ok(new { dismissed = true });
        }


        [HttpGet("drawings")]
        public async Task<IActionResult> GetDrawings([FromQuery] string symbol, [FromQuery] string timeframe, CancellationToken ct)
        {
            if (string.IsNullOrWhiteSpace(symbol)) return BadRequest(new { error = "symbol is required." });
            var userId = AuthService.GetUserId(User);
            var drawings = await _repo.GetDrawingsAsync(userId, symbol, timeframe ?? "1h", ct);
            return Ok(drawings);
        }

        [HttpPost("drawings")]
        public async Task<IActionResult> SaveDrawing([FromBody] SaveDrawingRequest request, CancellationToken ct)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Symbol) || string.IsNullOrWhiteSpace(request.DrawingType))
                return BadRequest(new { error = "Symbol and drawingType are required." });

            var userId = AuthService.GetUserId(User);
            var id = await _repo.SaveDrawingAsync(userId, request, ct);
            return Ok(new { id });
        }

        [HttpPut("drawings/{id}")]
        public async Task<IActionResult> UpdateDrawing(Guid id, [FromBody] SaveDrawingRequest request, CancellationToken ct)
        {
            if (request == null) return BadRequest(new { error = "Request body is required." });
            var userId = AuthService.GetUserId(User);
            await _repo.UpdateDrawingAsync(userId, id, request, ct);
            return Ok(new { updated = true });
        }

        [HttpDelete("drawings/{id}")]
        public async Task<IActionResult> DeleteDrawing(Guid id, CancellationToken ct)
        {
            var userId = AuthService.GetUserId(User);
            await _repo.DeleteDrawingAsync(userId, id, ct);
            return Ok(new { deleted = true });
        }
    }
}
