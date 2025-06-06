class AperiodicPatternGenerator {
    constructor() {
        this.maxAttempts = 10000;
        this.toleranceDistance = 0.1; // 10% tolerance for distance matching
        this.toleranceAngle = 5; // 5 degrees tolerance for angle matching
    }

    generatePattern(width, height, minDistance, density, uniquenessRadius = 5) {
        const points = [];
        // Better density calculation: assume hexagonal packing for max efficiency
        // Area per point in hexagonal packing = (sqrt(3)/2) * d^2
        const areaPerPoint = (Math.sqrt(3) / 2) * minDistance * minDistance;
        const maxPoints = Math.floor((width * height) / areaPerPoint);
        const targetCount = Math.floor(maxPoints * density * 0.7); // 0.7 factor for practical placement
        let attempts = 0;
        let consecutiveFailures = 0;
        
        while (points.length < targetCount && attempts < this.maxAttempts && consecutiveFailures < 1000) {
            attempts++;
            
            // Generate candidate point
            // No additional margin here as it's already handled in the main generator
            const candidate = {
                x: Math.random() * width,
                y: Math.random() * height
            };
            
            // Check minimum distance constraint
            if (!this.checkMinDistance(candidate, points, minDistance)) {
                consecutiveFailures++;
                continue;
            }
            
            // Check uniqueness of local configuration
            if (points.length >= uniquenessRadius && 
                !this.isLocalConfigurationUnique(candidate, points, uniquenessRadius)) {
                consecutiveFailures++;
                continue;
            }
            
            // Check collinearity constraint
            if (points.length >= 2 && this.hasCollinearNeighbors(candidate, points, minDistance * 2)) {
                consecutiveFailures++;
                continue;
            }
            
            points.push(candidate);
            consecutiveFailures = 0;
        }
        
        return points;
    }

    checkMinDistance(candidate, points, minDistance) {
        for (const point of points) {
            const dist = this.distance(candidate, point);
            if (dist < minDistance) {
                return false;
            }
        }
        return true;
    }

    distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isLocalConfigurationUnique(candidate, existingPoints, radius) {
        const candidateFingerprint = this.computeFingerprint(candidate, existingPoints, radius);
        
        // Check against all existing points
        for (const point of existingPoints) {
            const pointFingerprint = this.computeFingerprint(point, existingPoints, radius);
            if (this.fingerprintsMatch(candidateFingerprint, pointFingerprint)) {
                return false;
            }
        }
        
        return true;
    }

    computeFingerprint(point, allPoints, numNeighbors) {
        // Find nearest neighbors
        const neighbors = this.findNearestNeighbors(point, allPoints, numNeighbors);
        
        // Compute distances and angles to neighbors
        const fingerprint = neighbors.map(neighbor => {
            const dist = this.distance(point, neighbor);
            const angle = Math.atan2(neighbor.y - point.y, neighbor.x - point.x);
            return { distance: dist, angle: angle };
        });
        
        // Sort by distance to make comparison invariant to neighbor ordering
        fingerprint.sort((a, b) => a.distance - b.distance);
        
        return fingerprint;
    }

    findNearestNeighbors(point, allPoints, k) {
        const distances = allPoints
            .filter(p => p !== point)
            .map(p => ({ point: p, distance: this.distance(point, p) }))
            .sort((a, b) => a.distance - b.distance);
        
        return distances.slice(0, k).map(d => d.point);
    }

    fingerprintsMatch(fp1, fp2) {
        if (fp1.length !== fp2.length) return false;
        
        // Try all possible rotations
        for (let rotation = 0; rotation < 360; rotation += this.toleranceAngle) {
            const rotationRad = rotation * Math.PI / 180;
            let matches = true;
            
            for (let i = 0; i < fp1.length; i++) {
                const dist1 = fp1[i].distance;
                const dist2 = fp2[i].distance;
                const angle1 = fp1[i].angle;
                const angle2 = (fp2[i].angle + rotationRad) % (2 * Math.PI);
                
                // Check distance similarity
                if (Math.abs(dist1 - dist2) / dist1 > this.toleranceDistance) {
                    matches = false;
                    break;
                }
                
                // Check angle similarity
                const angleDiff = Math.abs(angle1 - angle2) * 180 / Math.PI;
                if (angleDiff > this.toleranceAngle && 
                    angleDiff < 360 - this.toleranceAngle) {
                    matches = false;
                    break;
                }
            }
            
            if (matches) return true;
        }
        
        return false;
    }

    hasCollinearNeighbors(candidate, points, checkRadius) {
        const nearbyPoints = points.filter(p => this.distance(candidate, p) <= checkRadius);
        
        // Check all pairs of nearby points
        for (let i = 0; i < nearbyPoints.length; i++) {
            for (let j = i + 1; j < nearbyPoints.length; j++) {
                if (this.areCollinear(candidate, nearbyPoints[i], nearbyPoints[j])) {
                    return true;
                }
            }
        }
        
        return false;
    }

    areCollinear(p1, p2, p3, tolerance = 0.01) {
        // Calculate area of triangle formed by three points
        const area = Math.abs(
            (p2.x - p1.x) * (p3.y - p1.y) - 
            (p3.x - p1.x) * (p2.y - p1.y)
        ) / 2;
        
        // Calculate the longest side
        const d12 = this.distance(p1, p2);
        const d13 = this.distance(p1, p3);
        const d23 = this.distance(p2, p3);
        const maxDist = Math.max(d12, d13, d23);
        
        // Points are collinear if area is very small relative to distances
        return area < tolerance * maxDist * maxDist;
    }

    exportToSVG(points, width, height, dotRadius = 3) {
        let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="black"/>`;
        
        for (const point of points) {
            svg += `\n    <circle cx="${point.x}" cy="${point.y}" r="${dotRadius}" fill="white"/>`;
        }
        
        svg += '\n</svg>';
        return svg;
    }

    validatePattern(points, uniquenessRadius = 5) {
        const issues = [];
        
        // Check each point for unique configuration
        for (let i = 0; i < points.length; i++) {
            const fingerprint1 = this.computeFingerprint(points[i], points, uniquenessRadius);
            
            for (let j = i + 1; j < points.length; j++) {
                const fingerprint2 = this.computeFingerprint(points[j], points, uniquenessRadius);
                
                if (this.fingerprintsMatch(fingerprint1, fingerprint2)) {
                    issues.push({
                        type: 'duplicate_configuration',
                        points: [i, j],
                        message: `Points ${i} and ${j} have similar local configurations`
                    });
                }
            }
        }
        
        // Check for collinear groups
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                for (let k = j + 1; k < points.length; k++) {
                    if (this.areCollinear(points[i], points[j], points[k])) {
                        issues.push({
                            type: 'collinear',
                            points: [i, j, k],
                            message: `Points ${i}, ${j}, and ${k} are collinear`
                        });
                    }
                }
            }
        }
        
        return {
            valid: issues.length === 0,
            issues: issues
        };
    }
}