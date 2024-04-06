import Road from '@/Road';
import Tile from '@/Tile';
import PathFinder from '@/PathFinder';

import { TilePosition, PixelPosition } from '@/types/Position';
import { Image } from '@/types/Phaser';

export default class Person {
    private x: number;
    private y: number;
    private depth: number;
    private speed: number;
    private currentTarget: Tile | null;
    private movingAxis: 'x' | 'y';
    private path: Tile[];
    private currentDestination: TilePosition;
    private asset: Image;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;

        this.depth = 0;
        this.speed = 1;

        this.currentTarget = null;
        this.movingAxis = 'x';

        this.path = [];
        this.currentDestination = null;
        this.asset = null;
    }

    walk(currentTile: Tile, _: number): void {
        if (!this.currentTarget || !(currentTile instanceof Road) || !this.asset) {
            return;
        }

        const targetCenter = this.currentTarget.getCenter();
        if (!targetCenter) {
            return;
        }
  
        // TODO: implement timeDelta to make the movement frame-independent
        const speedX = this.speed * Math.sign(targetCenter.x - this.x); // * timeDelta;
        const speedY = this.speed * Math.sign(targetCenter.y - this.y); // * timeDelta;
  
        let potentialX = this.x + speedX;
        let potentialY = this.y + speedY;
  
        if (this.movingAxis === 'x') {
           this.x = potentialX;
           if (this.isCurrentTargetXReached()) {
              this.movingAxis = 'y';
           }
        } else if (this.movingAxis === 'y') {
           this.y = potentialY;
           if (this.isCurrentTargetYReached()) {
              this.movingAxis = 'x';
           }
        }

        this.asset.setPosition(this.x, this.y);

        if (this.isCurrentTargetReached() && this.path.length) {
           this.setNextTarget();
        }
    }

    setNextTarget(): void {
        const nextTile = this.path.shift();
        if (!nextTile) {
            return;
        }

        this.currentTarget = nextTile;
        const targetCenter = this.currentTarget.getCenter();
        if (!targetCenter) {
            return;
        }
  
        // Decide whether to move in x or y direction based on the closer axis to the target
        const deltaX = Math.abs(targetCenter.x - this.x);
        const deltaY = Math.abs(targetCenter.y - this.y);
  
        this.movingAxis = deltaX > deltaY ? 'x' : 'y';
    }

    updateDestination(currentTile: Tile, destinations: Set<string>, pathFinder: PathFinder): void {
        if(!destinations.size) {
            return;
         }
         if (this.currentDestination) {
            return;
         }
   
         const destinationArray = Array.from(destinations);
         const destinationKey = Phaser.Math.RND.pick(destinationArray);
         const [destinationRow, destinationCol] = destinationKey.split('-').map(Number);
         if(!destinationRow || !destinationCol) {
            return;
         }

         this.currentDestination = { row: destinationRow, col: destinationCol };
   
         const currentTilePosition = {
            row: currentTile.getRow(),
            col: currentTile.getCol()
         };
   
         this.path = pathFinder.findPath(currentTilePosition, this.currentDestination);
         if (this.path?.length) {
            this.setNextTarget();
         }
    }

    isCurrentTargetXReached(): boolean {
        if (!this.currentTarget) {
            return false;
        }

        const targetPixelPosition = this.currentTarget.getCenter();
        if (!targetPixelPosition) {
            return false;
        }

        const targetX = targetPixelPosition.x;
        const distance = Math.abs(this.x - targetX);
        return distance < 1;
    }

    isCurrentTargetYReached(): boolean {
        if (!this.currentTarget) {
            return false;
        }

        const targetPixelPosition = this.currentTarget.getCenter();
        if (!targetPixelPosition) {
            return false;
        }

        const targetY = targetPixelPosition.y;
        const distance = Math.abs(this.y - targetY);
        return distance < 1;
    }

    isCurrentTargetReached(): boolean {
        return this.isCurrentTargetXReached() && this.isCurrentTargetYReached();
    }

    updateDepth(currentTile: Tile): void {
        if (!this.asset) {
            return;
         }
   
         const row = currentTile.getRow();
         this.depth = (row * 10) + 1;
         this.asset.setDepth(this.depth);
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
}