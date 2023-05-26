pipeline {
  agent {
    node {
      label 'nodejs-14.19.0'
    }
  }

  parameters {
    string(name:'TAG_NAME', defaultValue: '', description:'')
  }

  options {
    buildDiscarder(logRotator(numToKeepStr: '5'))
    quietPeriod(1)
  }

  environment {
    HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
    KUBECONFIG_CREDENTIAL_ID = 'pipeline-user-kubeconfig'
    APP_NAME = 'test-coverage-server'
    CONTAINER_PORT = '8000'
    GITLAB_URL = 'http://192.168.13.78/frontend/web/test-coverage-server.git'
    GITLAB_ID = 'pipeline-user-gitlab'
    GITLAB_USERNAME = 'pipeline-user'
    WX_WORK_TOKEN = '31e79e6a-fa8a-415b-8ecd-9ba0ba92320a'
  }


    stages {
        stage ('checkout scm') {
            steps {
                checkout(scm)
                script {
                sh 'wget http://192.168.13.78/paas-pub/pipeline/-/raw/master/script/notify-qywx.py'
                sh 'wget http://192.168.13.78/paas-pub/pipeline/-/raw/master/deploy/ur-platform/node/Dockerfile'

                }
            }
        }

    stage ('build develop') {
      when {
        anyOf {
          branch 'develop'
          branch 'develop-deploy'
        }
      }
      environment {
        HARBOR_HOST = 'bytest-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-platform-test'
        HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
         
      }
      steps {
        container('nodejs') {
          sh 'pnpm config set store-dir `pwd`/home/jenkins/agent/.pnpm-store/v3'
          sh 'pnpm install -g @ur-constructions/test-coverage-cli'
          sh 'pnpm install'
          sh 'docker build -f `pwd`/Dockerfile -t $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER .'
          withCredentials([usernamePassword(credentialsId : "$HARBOR_CREDENTIAL_ID" ,passwordVariable : 'HARBOR_PASSWORD' ,usernameVariable : 'HARBOR_USERNAME' ,)]) {
            sh 'echo "$HARBOR_PASSWORD" | docker login $HARBOR_HOST -u "$HARBOR_USERNAME" --password-stdin'
            sh 'docker push  $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER'
          }
        }
      }
      post {
        failure {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Dev构建失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage ('build test') {
      when {
        anyOf {
          branch 'test'
          branch 'test-deploy'
        }
      }
      environment {
        HARBOR_HOST = 'bytest-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-platform-test'
        HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
        BUILD_ENV = 'test'
      }
      steps {
        container('nodejs') {
          sh 'npm config set registry http://nexus.ur.com.cn/repository/npm-host/'
          sh 'npm install -g @ur-constructions/test-coverage-cli/test-coverage-cli-1.0.0.tgz'
          sh 'pnpm install'
          sh 'docker build -f `pwd`/Dockerfile -t $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER .'
          withCredentials([usernamePassword(credentialsId : "$HARBOR_CREDENTIAL_ID" ,passwordVariable : 'HARBOR_PASSWORD' ,usernameVariable : 'HARBOR_USERNAME' ,)]) {
            sh 'echo "$HARBOR_PASSWORD" | docker login $HARBOR_HOST -u "$HARBOR_USERNAME" --password-stdin'
            sh 'docker push  $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER'
          }
        }
      }
      post {
        failure {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Test构建失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage ('build pre') {
      when {
        anyOf {
          branch 'pre'
          branch 'pre-deploy'
        }
      }
      environment {
        HARBOR_HOST = 'hw-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-pre'
        HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
      }
      steps {
        container('nodejs') {     
          sh 'pnpm install'
          sh 'docker build -f `pwd`/Dockerfile -t $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER .'
          withCredentials([usernamePassword(credentialsId : "$HARBOR_CREDENTIAL_ID" ,passwordVariable : 'HARBOR_PASSWORD' ,usernameVariable : 'HARBOR_USERNAME' ,)]) {
            sh 'echo "$HARBOR_PASSWORD" | docker login $HARBOR_HOST -u "$HARBOR_USERNAME" --password-stdin'
            sh 'docker push $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER'
          }
        }
      }
      post {
        failure {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Pre构建失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage ('build release') {
      when {
        tag 'release-*'
      }
      environment {
        HARBOR_HOST = 'hw-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-prod'
        HARBOR_CREDENTIAL_ID = 'pipeline-user-harbor'
      }
      steps {
        container('nodejs') {
          sh 'npm config set registry http://nexus.ur.com.cn/repository/npm-group/'
          sh 'pnpm install'
          sh 'pnpm install @ur-constructions/test-coverage-cli'
          sh 'docker build -f `pwd`/Dockerfile -t $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER .'
          withCredentials([usernamePassword(credentialsId : "$HARBOR_CREDENTIAL_ID" ,passwordVariable : 'HARBOR_PASSWORD' ,usernameVariable : 'HARBOR_USERNAME' ,)]) {
            sh 'echo "$HARBOR_PASSWORD" | docker login $HARBOR_HOST -u "$HARBOR_USERNAME" --password-stdin'
            sh 'docker push $HARBOR_HOST/$HARBOR_NAMESPACE/$APP_NAME:$BRANCH_NAME-$BUILD_NUMBER'
          }
        }
      }
      post {
        failure {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Prod构建失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage('deploy to develop') {
      when {
        anyOf {
          branch 'develop'
          branch 'develop-deploy'
        }
      }
      environment {
        NAMESPACE =  'ur-dev'
        HARBOR_HOST = 'bytest-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-platform-test'
      }
      steps {
        container ('nodejs') {
          withCredentials([kubeconfigFile(credentialsId: env.KUBECONFIG_CREDENTIAL_ID, variable: 'KUBECONFIG')]) {
            sh 'wget https://git.ur.com.cn/paas-pub/pipeline/-/raw/master/deploy/ur-platform/node/dev/1c_2g/deployment.yaml'
            sh 'envsubst < `pwd`/deployment.yaml | cat -'
            sh 'envsubst < `pwd`/deployment.yaml | kubectl apply -f -'
          }
        }
      }
      post {
        always {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Dev镜像部署成功 $WX_WORK_TOKEN'
        }
        failure {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Dev镜像部署失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage('deploy to test') {
      when {
        anyOf {
          branch 'test'
          branch 'test-deploy'
        }
      }
      environment {
        NAMESPACE =  'ur-test'
        HARBOR_HOST = 'bytest-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-platform-test'
      }
      steps {
        container ('nodejs') {
          withCredentials([kubeconfigFile(credentialsId: env.KUBECONFIG_CREDENTIAL_ID, variable: 'KUBECONFIG')]) {
            sh 'wget https://git.ur.com.cn/paas-pub/pipeline/-/raw/master/deploy/ur-platform/node/dev/1c_2g/deployment.yaml'
            sh 'envsubst < `pwd`/deployment.yaml | cat -'
            sh 'envsubst < `pwd`/deployment.yaml | kubectl apply -f -'
          }
        }
      }
      post {
        always {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Test镜像部署成功 $WX_WORK_TOKEN'
        }
        failure {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Test镜像部署失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage('deploy to pre') {
      when {
        anyOf {
          branch 'pre'
          branch 'pre-deploy'
        }
      }
      environment {
        NAMESPACE =  'ur-pre'
        HARBOR_HOST = 'hw-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-platform-pre'
      }
      steps {
        container ('nodejs') {
          withCredentials([kubeconfigFile(credentialsId: env.KUBECONFIG_CREDENTIAL_ID, variable: 'KUBECONFIG')]) {
            sh 'wget https://git.ur.com.cn/paas-pub/pipeline/-/raw/master/deploy/ur-platform/node/pre/1c_2g/deployment.yaml'
            sh 'envsubst < `pwd`/deployment.yaml | cat -'
            sh 'envsubst < `pwd`/deployment.yaml | kubectl apply -f -'
          }
        }
      }
      post {
        always {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Pre镜像部署成功 $WX_WORK_TOKEN'
        }
        failure {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Pre镜像部署失败 $WX_WORK_TOKEN'
        }
      }
    }

    stage ('deploy release') {
      when {
        tag 'release-*'
      }
      environment {
        NAMESPACE =  'ur-prod'
        HARBOR_HOST = 'hw-harbor.ur.com.cn'
        HARBOR_NAMESPACE = 'ur-platform-prod'
      }
      steps {
        container ('nodejs') {
          withCredentials([kubeconfigFile(credentialsId: env.KUBECONFIG_CREDENTIAL_ID, variable: 'KUBECONFIG')]) {
            sh 'wget https://git.ur.com.cn/paas-pub/pipeline/-/raw/master/deploy/ur-platform/node/prod/1c_2g/deployment.yaml'
            sh 'envsubst < `pwd`/deployment.yaml | cat -'
            sh 'envsubst < `pwd`/deployment.yaml | kubectl apply -f -'
          }
        }
      }
      post {
        always {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Prod镜像部署成功 $WX_WORK_TOKEN'
        }
        failure {
          sh 'python `pwd`/notify-qywx.py $APP_NAME $HARBOR_NAMESPACE $GITLAB_URL Prod镜像部署失败 $WX_WORK_TOKEN'
        }
      }
    }
  }
}