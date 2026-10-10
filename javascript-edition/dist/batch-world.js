import * as THREE from './three.js';
// Consolidate static scenery into material batches to keep dense streets fast.
export function batchWorld(root){root.updateMatrixWorld(true);const groups=new Map();root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;for(let parent=o;parent;parent=parent.parent)if(parent.userData.breakable)return;const m=o.material,key=[m.type,m.color?.getHex(),m.roughness,m.metalness,m.opacity,m.transparent,m.depthWrite,m.side,m.map?.uuid].join('/');if(!groups.has(key))groups.set(key,{material:m,objects:[]});groups.get(key).objects.push(o);});
 for(const {material,objects} of groups.values()){if(objects.length<2)continue;const positions=[],normals=[],uvs=[],indices=[];let offset=0;const v=new THREE.Vector3(),normal=new THREE.Vector3();
   for(const o of objects){const g=o.geometry,p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;if(!p)continue;const normalMatrix=new THREE.Matrix3().getNormalMatrix(o.matrixWorld);
     for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);positions.push(v.x,v.y,v.z);if(n)normal.fromBufferAttribute(n,i).applyMatrix3(normalMatrix).normalize();else normal.set(0,1,0);normals.push(normal.x,normal.y,normal.z);uvs.push(u?u.getX(i):0,u?u.getY(i):0);}
     if(g.index)for(let i=0;i<g.index.count;i++)indices.push(g.index.getX(i)+offset);else for(let i=0;i<p.count;i++)indices.push(i+offset);offset+=p.count;o.parent.remove(o);g.dispose();
   }
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeBoundingSphere();root.add(new THREE.Mesh(geo,material));
 }
}
