import Road from 'app/Road';
import Tile from 'app/Tile';
import Building from 'app/Building';
import PathFinder from 'app/PathFinder';

import { TilePosition, PixelPosition } from 'types/Position';
import { Image } from 'types/Phaser';
import { Direction, Axis } from 'types/Movement';

export default class Vehicle {
    private x: number;
    private y: number;

    private depth: number;
    private speed: number;
    private rotationSpeed: number;

    private currentTarget: PixelPosition | null;
    private direction: Direction;
    private movingAxis: Axis;

    private path: Tile[];
    private currentDestination: TilePosition;

    private asset: Image;

    private redrawFunction: ((timeDelta: number) => void) | null;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;

        this.depth = 0;
        this.speed = 0.1;
        this.rotationSpeed = 0.007;

        this.currentTarget = null;
        this.direction = Direction.East;
        this.movingAxis = Axis.X;

        this.path = [];
        this.currentDestination = null;
        this.asset = null;

        this.redrawFunction = null;
    }

    drive(currentTile: Tile, timeDelta: number): void {
        if (!this.asset || !this.currentTarget || !(currentTile instanceof Road)) {
            return;
        }

        const speedX = this.speed * Math.sign(this.currentTarget.x - this.x) * timeDelta;
        const speedY = this.speed * Math.sign(this.currentTarget.y - this.y) * timeDelta;

        const potentialX = this.x + speedX;
        const potentialY = this.y + speedY;

        if (this.movingAxis === Axis.X) {
            this.x = potentialX;
            this.direction = speedX > 0 ? Direction.East : Direction.West;
            if (this.isCurrentTargetXReached() && !this.isCurrentTargetYReached()) {
                this.movingAxis = Axis.Y;
            }
        } else if (this.movingAxis === Axis.Y) {
            this.y = potentialY;
            this.direction = speedY > 0 ? Direction.South : Direction.North;
            if (this.isCurrentTargetYReached() && !this.isCurrentTargetXReached()) {
                this.movingAxis = Axis.X;
            }
        }

        this.updateDepth(currentTile);

        if (this.isCurrentTargetReached()) {
            this.setNextTarget(currentTile);
        }
    }

    setNextTarget(currentTile: Tile): void {
        if (!this.path.length || !currentTile) {
            return;
        }

        const currentTilePosition = currentTile.getPosition();
        if (!currentTilePosition) {
            console.warn(`[Vehicle] Can't set next target, current position not valid`, currentTilePosition);
            return;
        }

        const nextTile = this.path.shift();
        if (!nextTile) {
            return;
        }

        if (nextTile instanceof Building) {
            this.currentTarget = nextTile.getEntrance();
            return;
        }

        // If next tile is not a Building nor a Road, stay still
        if (!(nextTile instanceof Road)){
            console.warn(`[Vehicle] Next tile is not a road`, nextTile);
            return;
        }
         
        const nextTilePosition = nextTile.getPosition();
        const lanes = nextTile.getLane();
        if (!nextTilePosition || !lanes) {
            console.warn(`[Vehicle] Could not determine next tile position or lanes`, nextTile, lanes);
            return;
        }

        // get direction of nextTile relative to currentTile
        const relativeDirection = currentTile.getRelativeDirection(nextTile);
        if (!relativeDirection) {
            console.warn(`[Vehicle] Could not determine relative tile direction`, currentTile, nextTile);
            return;
        }

        // Determine which lane entry Point is going to be the next target
        this.currentTarget = nextTile.getLaneEntryPoint(relativeDirection);
    }

    updateDestination(currentTile: Tile, destinations: Set<string>, pathFinder: PathFinder): void {
        if (!destinations.size) {
            return;
        }
        if (this.currentDestination) {
            return;
        }

        const destinationArray = Array.from(destinations);
        const destinationKey = Phaser.Math.RND.pick(destinationArray);
        const [destinationRow, destinationCol] = destinationKey.split('-').map(Number);
        if (!destinationRow || !destinationCol) {
            return;
        }

        this.currentDestination = { row: destinationRow, col: destinationCol };

        const currentTilePosition = {
            row: currentTile.getRow(),
            col: currentTile.getCol()
        };

        this.path = pathFinder.findPath(currentTilePosition, this.currentDestination);
        if (this.path?.length) {
            this.setNextTarget(currentTile);
        }
    }

    isCurrentTargetXReached(): boolean {
        if (!this.currentTarget) {
            return false;
        }
        return Math.abs(this.currentTarget.x - this.x) < 1;
    }

    isCurrentTargetYReached(): boolean {
        if (!this.currentTarget) {
            return false;
        }
        return Math.abs(this.currentTarget.y - this.y) < 1;
    }

    isCurrentTargetReached(): boolean {
        return this.isCurrentTargetXReached() && this.isCurrentTargetYReached();
    }

    updateDepth(currentTile: Tile): void {
        const row = currentTile.getRow();
        this.depth = ((row + 1) * 10) + 1;
    }

    rotate(currentRotation: number, timeDelta: number): number {
        let desiredRotation;
        if (this.direction === Direction.North) {
            desiredRotation = -Math.PI / 2;
        } else if (this.direction === Direction.South) {
            desiredRotation = Math.PI / 2;
        } else if (this.direction === Direction.East) {
            desiredRotation = 0;
        } else if (this.direction === Direction.West) {
            desiredRotation = Math.PI;
        } else {
            desiredRotation = 0;
        }
        
        // Normalize currentRotation to be within -pi to pi
        currentRotation = (currentRotation % (2 * Math.PI) + (2 * Math.PI)) % (2 * Math.PI);
        if (currentRotation > Math.PI) {
            currentRotation -= 2 * Math.PI;
        }

        if (currentRotation === desiredRotation) {
            return currentRotation;
        }
        
        // Calculate the shortest rotation direction
        let rotationDelta = desiredRotation - currentRotation;
        if (rotationDelta > Math.PI) {
            rotationDelta -= 2 * Math.PI;
        } else if (rotationDelta < -Math.PI) {
            rotationDelta += 2 * Math.PI;
        }

        // convert rotationDelta to degrees
        const rotationDeltaDegrees = rotationDelta * (180 / Math.PI);

        const snapThreshold = 180;
        if (rotationDeltaDegrees >= snapThreshold) {
            console.log(rotationDeltaDegrees);
            console.log("SNAP");
            //return desiredRotation;
        }
        
        // Calculate newRotation and normalize it to be within -pi to pi
        const rotationDirection = Math.sign(rotationDelta);
        const rotationAmount = Math.min(Math.abs(rotationDelta), this.rotationSpeed * timeDelta) * rotationDirection;
        let newRotation = currentRotation + rotationAmount;
        newRotation = (newRotation + 2 * Math.PI) % (2 * Math.PI); 

        return newRotation;
    }

    getDepth(): number {
        return this.depth;
    }

    getPosition(): PixelPosition {
        return { x: this.x, y: this.y };
    }

    setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }

    getAsset(): Image | null {
        return this.asset;
    }

    setAsset(asset: Image): void {
        this.asset = asset;
    }

    setRedrawFunction(redrawFunction: (timeDelta: number) => void): void {
        this.redrawFunction = redrawFunction;
    }

    getDirection(): Direction {
        return this.direction;
    }

    redraw(timeDelta: number): void {
        if (this.redrawFunction) {
            this.redrawFunction(timeDelta);
        }
    }
}